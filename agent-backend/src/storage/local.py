import os
import logging
from pathlib import Path

from storage.provider import StorageProvider

logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger('storage.local')

class LocalStorageProvider(StorageProvider):
    allowed_delete_error_codes = ['ENOENT']

    def __init__(self):
        self.base_path = os.getenv('UPLOADS_BASE_PATH', './uploads')
        self.init()

    async def init(self):
        Path(self.base_path).mkdir(parents=True, exist_ok=True)

    async def upload_local_file(self, filename, uploaded_file, content_type, is_public=False):
        file_path = os.path.join(self.base_path, filename)
        try:
            with open(file_path, 'wb') as f:
                f.write(uploaded_file.data)
            log.debug(f"File '{filename}' uploaded successfully.")
        except Exception as e:
            log.error(f"Failed to upload file: {e.message}")
            raise e

    async def upload_buffer(self, filename, content, content_type, is_public=False):
        file_path = os.path.join(self.base_path, filename)
        try:
            with open(file_path, 'wb') as f:
                f.write(content)
            log.debug(f"Buffer uploaded to '{filename}' successfully.")
        except Exception as e:
            log.error(f"Failed to upload buffer: {e.message}")
            raise e

    async def delete_file(self, filename):
        file_path = os.path.join(self.base_path, filename)
        try:
            os.remove(file_path)
            log.debug(f"File '{filename}' deleted successfully.")
        except Exception as e:
            if e.errno not in self.allowed_delete_error_codes:
                log.error(f"Failed to delete file: {e.message}")
                raise e

    def get_base_path(self):
        return '/static'

local_storage_provider = LocalStorageProvider()