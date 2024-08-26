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
        

    def init(self):
        Path(self.base_path).mkdir(parents=True, exist_ok=True)

    def upload_local_file(self, filename, file_folder, is_public=False):
        
        if not os.path.exists(os.path.join(self.base_path, file_folder)):
            os.makedirs(os.path.join(self.base_path, file_folder))
        original_file_path = os.path.join(Path(__file__).resolve().parent.parent,'outputs', filename)  # Open from original path
        file_path = os.path.join(self.base_path, file_folder, filename)  # Save to self.base_path
        try:
            shutil.copyfile(original_file_path, file_path)
            log.debug(f"File '{filename}' uploaded successfully.")
            os.remove(original_file_path)
        except Exception as e:
            log.error(f"Failed to upload file: {e}")
            raise e


    def delete_file(self, filename, file_folder):
        file_path = os.path.join(self.base_path, file_folder, filename)
        try:
            os.remove(file_path)
            log.debug(f"File '{filename}' deleted successfully.")
        except Exception as e:
            if e.errno not in self.allowed_delete_error_codes:
                log.error(f"Failed to delete file: {e.message}")
                raise e

local_storage_provider = LocalStorageProvider()