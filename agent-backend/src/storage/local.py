import json
import os
import logging
from pathlib import Path
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
    def init(self):
        Path(self.base_path).mkdir(parents=True, exist_ok=True)

    def upload_file_buffer(self, buffer, filename, folder_path, is_public=False):
        log.debug('Uploading buffer content as file %s', filename)
        
        if not os.path.exists(os.path.join(self.base_path, folder_path)):
            os.makedirs(os.path.join(self.base_path, folder_path))
        
        file_path = os.path.join(self.base_path, folder_path, filename)
        
        try:
            with open(file_path, 'wb') as f:
                f.write(buffer.read())
            log.debug('Buffer content uploaded successfully.')
        except Exception as err:
            log.error('Buffer upload error:', err)
            raise err
    def delete_file(self, filename, file_folder, is_public=False):
        log.debug("Deleting file %s", filename)
        file_path = os.path.join(self.base_path, file_folder, filename)
        
        try:
            os.remove(file_path)
            log.debug("File deleted successfully.")
        except FileNotFoundError:
            log.warning("File not found: %s", file_path)
        except Exception as err:
            log.error("Error deleting file: %s", err)
            raise err

    def get_signed_url(self, filename, file_folder, is_public=False):
        return f"{os.getenv('WEBAPP_URL')}/tmp/{file_folder}/{filename}"



local_storage_provider = LocalStorageProvider()
