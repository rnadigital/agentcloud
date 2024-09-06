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
            os.getenv("MINIO_ENDPOINT", "localhost:9000"),
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

    def upload_file_buffer(self, buffer, filename, folder_path, is_public=False):
        log.debug("Uploading buffer content as file %s", filename)
        try:
            self.minio_client.put_object(
                self.bucket_name,
                f"{folder_path}/{filename}",
                buffer,
                len(buffer),
                content_type="application/octet-stream",
            )
            log.debug("Buffer content uploaded successfully.")
        except Exception as err:
            log.error("Buffer upload error:", err)
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
        log.debug("Generating signed URL for file %s", filename)
        try:
            url = self.minio_client.presigned_get_object(
                self.bucket_name,
                f"{file_folder}/{filename}",
                expires=60 * 60 * 24 * 365 * 100,  # 100 years
            )
            return url
        except S3Error as e:
            log.error(f"Failed to get signed URL: {e}")
            raise e


local_storage_provider = LocalStorageProvider()
