import os
import logging
from pathlib import Path
import shutil

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

    async def upload_local_file(self, filename, is_public=False):
        original_file_path = os.path.join(Path(__file__).resolve().parent.parent, filename)  # Open from original path
        file_path = os.path.join(self.base_path, 'outputs', filename)  # Save to self.base_path
        try:
            shutil.copyfile(original_file_path, file_path)
            log.debug(f"File '{filename}' uploaded successfully.")
        except Exception as e:
            log.error(f"Failed to upload file: {e}")
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

local_storage_provider = LocalStorageProvider()