from typing import Any, AsyncIterator, Dict, Optional, Sequence, Tuple

from langchain_core.runnables import RunnableConfig
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import UpdateOne

from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    ChannelVersions,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    get_checkpoint_id,
)

from init.env_variables import MONGO_DB_NAME


class AsyncMongoDBSaver(BaseCheckpointSaver):
    """A checkpoint saver that stores checkpoints in a MongoDB database asynchronously."""

    client: AsyncIOMotorClient
    db: AsyncIOMotorDatabase

    def __init__(
            self
    ) -> None:
        super().__init__()
        self.client = AsyncIOMotorClient()
        self.db = self.client[MONGO_DB_NAME]

    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        """Get a checkpoint tuple from the database asynchronously.

        This method retrieves a checkpoint tuple from the MongoDB database based on the
        provided config. If the config contains a "checkpoint_id" key, the checkpoint with
        the matching thread ID and checkpoint ID is retrieved. Otherwise, the latest checkpoint
        for the given thread ID is retrieved.

        Args:
            config (RunnableConfig): The config to use for retrieving the checkpoint.

        Returns:
            Optional[CheckpointTuple]: The retrieved checkpoint tuple, or None if no matching checkpoint was found.
        """
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        if checkpoint_id := get_checkpoint_id(config):
            query = {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
            }
        else:
            query = {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
            }

        result = self.db["checkpoints"].find(query).sort("checkpoint_id", -1).limit(1)
        async for doc in result:
            config_values = {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": doc["checkpoint_id"],
            }
            checkpoint = self.serde.loads_typed((doc["type"], doc["checkpoint"]))
            serialized_writes = self.db["checkpoint_writes"].find(config_values)
            pending_writes = [
                (
                    doc["task_id"],
                    doc["channel"],
                    self.serde.loads_typed((doc["type"], doc["value"])),
                )
                async for doc in serialized_writes
            ]
            return CheckpointTuple(
                {"configurable": config_values},
                checkpoint,
                self.serde.loads(doc["metadata"]),
                (
                    {
                        "configurable": {
                            "thread_id": thread_id,
                            "checkpoint_ns": checkpoint_ns,
                            "checkpoint_id": doc["parent_checkpoint_id"],
                        }
                    }
                    if doc.get("parent_checkpoint_id")
                    else None
                ),
                pending_writes,
            )

    async def alist(
            self,
            config: Optional[RunnableConfig],
            *,
            filter: Optional[Dict[str, Any]] = None,
            before: Optional[RunnableConfig] = None,
            limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        """List checkpoints from the database asynchronously.

        This method retrieves a list of checkpoint tuples from the MongoDB database based
        on the provided config. The checkpoints are ordered by checkpoint ID in descending order (newest first).

        Args:
            config (Optional[RunnableConfig]): Base configuration for filtering checkpoints.
            filter (Optional[Dict[str, Any]]): Additional filtering criteria for metadata.
            before (Optional[RunnableConfig]): If provided, only checkpoints before the specified checkpoint ID are returned. Defaults to None.
            limit (Optional[int]): Maximum number of checkpoints to return.

        Yields:
            AsyncIterator[CheckpointTuple]: An asynchronous iterator of matching checkpoint tuples.
        """
        query = {}
        if config is not None:
            query = {
                "thread_id": config["configurable"]["thread_id"],
                "checkpoint_ns": config["configurable"].get("checkpoint_ns", ""),
            }

        if filter:
            for key, value in filter.items():
                query[f"metadata.{key}"] = value

        if before is not None:
            query["checkpoint_id"] = {"$lt": before["configurable"]["checkpoint_id"]}

        result = self.db["checkpoints"].find(query).sort("checkpoint_id", -1)

        if limit is not None:
            result = result.limit(limit)
        async for doc in result:
            checkpoint = self.serde.loads_typed((doc["type"], doc["checkpoint"]))
            yield CheckpointTuple(
                {
                    "configurable": {
                        "thread_id": doc["thread_id"],
                        "checkpoint_ns": doc["checkpoint_ns"],
                        "checkpoint_id": doc["checkpoint_id"],
                    }
                },
                checkpoint,
                self.serde.loads(doc["metadata"]),
                (
                    {
                        "configurable": {
                            "thread_id": doc["thread_id"],
                            "checkpoint_ns": doc["checkpoint_ns"],
                            "checkpoint_id": doc["parent_checkpoint_id"],
                        }
                    }
                    if doc.get("parent_checkpoint_id")
                    else None
                ),
            )

    async def aput(
            self,
            config: RunnableConfig,
            checkpoint: Checkpoint,
            metadata: CheckpointMetadata,
            new_versions: ChannelVersions,
    ) -> RunnableConfig:
        """Save a checkpoint to the database asynchronously.

        This method saves a checkpoint to the MongoDB database. The checkpoint is associated
        with the provided config and its parent config (if any).

        Args:
            config (RunnableConfig): The config to associate with the checkpoint.
            checkpoint (Checkpoint): The checkpoint to save.
            metadata (CheckpointMetadata): Additional metadata to save with the checkpoint.
            new_versions (ChannelVersions): New channel versions as of this write.

        Returns:
            RunnableConfig: Updated configuration after storing the checkpoint.
        """
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"]["checkpoint_ns"]
        checkpoint_id = checkpoint["id"]
        type_, serialized_checkpoint = self.serde.dumps_typed(checkpoint)
        doc = {
            "parent_checkpoint_id": config["configurable"].get("checkpoint_id"),
            "type": type_,
            "checkpoint": serialized_checkpoint,
            "metadata": self.serde.dumps(metadata),
        }
        upsert_query = {
            "thread_id": thread_id,
            "checkpoint_ns": checkpoint_ns,
            "checkpoint_id": checkpoint_id,
        }
        # Perform your operations here
        await self.db["checkpoints"].update_one(
            upsert_query, {"$set": doc}, upsert=True
        )
        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
            }
        }

    async def aput_writes(
            self,
            config: RunnableConfig,
            writes: Sequence[Tuple[str, Any]],
            task_id: str,
    ) -> None:
        """Store intermediate writes linked to a checkpoint asynchronously.

        This method saves intermediate writes associated with a checkpoint to the database.

        Args:
            config (RunnableConfig): Configuration of the related checkpoint.
            writes (Sequence[Tuple[str, Any]]): List of writes to store, each as (channel, value) pair.
            task_id (str): Identifier for the task creating the writes.
        """
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"]["checkpoint_ns"]
        checkpoint_id = config["configurable"]["checkpoint_id"]
        operations = []
        for idx, (channel, value) in enumerate(writes):
            upsert_query = {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
                "task_id": task_id,
                "idx": idx,
            }
            type_, serialized_value = self.serde.dumps_typed(value)
            operations.append(
                UpdateOne(
                    upsert_query,
                    {
                        "$set": {
                            "channel": channel,
                            "type": type_,
                            "value": serialized_value,
                        }
                    },
                    upsert=True,
                )
            )
        await self.db["checkpoint_writes"].bulk_write(operations)
