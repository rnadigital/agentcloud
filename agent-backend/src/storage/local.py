from datetime import timedelta
import json
import os
import logging
from pathlib import Path
import shutil
from init.env_variables import UPLOADS_BASE_PATH
from storage.provider import StorageProvider
from minio import Minio
from minio.error import S3Error

logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger("storage.local")


class LocalStorageProvider(StorageProvider):
    allowed_delete_error_codes = ["ENOENT"]

    def __init__(self):
        self.base_path = UPLOADS_BASE_PATH if UPLOADS_BASE_PATH else "./uploads"
        self.init()
        self.minio_client = Minio(
            os.getenv("MINIO_INTERNAL_ENDPOINT", "minio:9000"),
            access_key=os.getenv("MINIO_ROOT_USER", "minioadmin"),
            secret_key=os.getenv("MINIO_ROOT_PASSWORD", "minioadmin"),
            secure=False,
        )
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "uploads")
        self.create_bucket()

    def init(self):
        Path(self.base_path).mkdir(parents=True, exist_ok=True)

    def create_bucket(self):
        try:
            if not self.minio_client.bucket_exists(self.bucket_name):
                self.minio_client.make_bucket(self.bucket_name)
                log.debug(f"Bucket '{self.bucket_name}' created successfully.")
            else:
                log.debug(f"Bucket '{self.bucket_name}' already exists.")
        except S3Error as e:
            log.error(f"Failed to create bucket: {e}")
            raise e
        self.set_bucket_policy()

    def set_bucket_policy(self):

        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{self.bucket_name}/*",
                }
            ],
        }

        policy_str = json.dumps(policy)

        self.minio_client.set_bucket_policy(self.bucket_name, policy_str)
        print(f"Public read policy applied to bucket '{self.bucket_name}'.")

    def upload_file_buffer(self, buffer, filename, folder_path, is_public=False):
        log.debug("Uploading buffer content as file %s", filename)
        try:
            buffer_size = buffer.getbuffer().nbytes
            self.minio_client.put_object(
                self.bucket_name,
                f"{folder_path}/{filename}",
                buffer,
                buffer_size,
                content_type="application/octet-stream",
            )
            log.debug("Buffer content uploaded successfully.")
        except Exception as err:
            log.error("Buffer upload error: %s", err)
            raise err

    def upload_local_file(self, filename, folder_path, is_public=False):
        log.debug("Uploading file %s", filename)
        original_file_path = os.path.join(
            Path(__file__).resolve().parent.parent, "outputs", filename
        )
        try:
            self.minio_client.fput_object(
                self.bucket_name, f"{folder_path}/{filename}", original_file_path
            )
            log.debug("File uploaded successfully.")
            os.remove(original_file_path)
        except Exception as err:
            log.error("File upload error:", err)
            raise err

    def delete_file(self, filename, file_folder, is_public=False):
        log.debug("Deleting file %s", filename)
        try:
            self.minio_client.remove_object(
                self.bucket_name, f"{file_folder}/{filename}"
            )
            log.debug("File deleted successfully.")
        except S3Error as e:
            if e.code not in self.allowed_delete_error_codes:
                log.error(f"Failed to delete file: {e.message}")
                raise e

    def get_signed_url(self, filename, file_folder, is_public=False):
        log.debug("Generating public URL for file %s", filename)
        try:
            external_endpoint = os.getenv("MINIO_EXTERNAL_ENDPOINT", "localhost:9000")
            file_url = f"http://{external_endpoint}/{self.bucket_name}/{file_folder}/{filename}"

            return file_url
        except Exception as e:
            log.error(f"Failed to get public URL: {e}")
            raise e


local_storage_provider = LocalStorageProvider()
