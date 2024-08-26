from google.cloud import storage
import os
import logging
from pathlib import Path

from storage.provider import StorageProvider

logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger('storage.google')

class GoogleStorageProvider(StorageProvider):
    def __init__(self):
        options = {'project': os.getenv('PROJECT_ID')}
        self.storage_client = storage.Client(**options)

    async def init(self):
        pass

    async def create_bucket(self, bucket_name=None, options=None):
        if bucket_name is None:
            bucket_name = os.getenv('NEXT_PUBLIC_GCS_BUCKET_NAME')
        try:
            bucket = self.storage_client.create_bucket(bucket_name, **(options or {}))
            log.debug(f'GCS Bucket {bucket.name} created.')
            return bucket
        except Exception as e:
            if e.code == 409:
                log.warning(f'Warning when creating GCS bucket: {e.message}')
            log.error(f'Failed to create GCS bucket: {e.message}')
            raise e

    def upload_local_file(self, filename, folder_path, is_public=False):
        log.debug('Uploading file %s', filename)
        bucket_name = os.getenv('NEXT_PUBLIC_GCS_BUCKET_NAME' if is_public else 'NEXT_PUBLIC_GCS_BUCKET_NAME_PRIVATE')
        bucket = self.storage_client.bucket(bucket_name)
        
        original_file_path = os.path.join(Path(__file__).resolve().parent.parent, 'outputs', filename)  
        blob = bucket.blob(f"{folder_path}/{filename}")
        try:
            blob.upload_from_filename(original_file_path)
            log.debug('File uploaded successfully.')
            if is_public:
                blob.make_public()
            os.remove(original_file_path)
        except Exception as err:
            log.error('File upload error:', err)
            raise err

    async def delete_file(self, filename, file_folder, is_public=False):
        log.debug('Deleting file %s', filename)
        bucket_name = os.getenv('NEXT_PUBLIC_GCS_BUCKET_NAME' if is_public else 'NEXT_PUBLIC_GCS_BUCKET_NAME_PRIVATE')
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(f"{file_folder}/{filename}")
        blob.delete()

google_storage_provider = GoogleStorageProvider()