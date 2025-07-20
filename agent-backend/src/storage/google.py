import datetime
from google.cloud import storage
from google.oauth2 import service_account
import os
import json
import logging
from pathlib import Path
from init.env_variables import GCS_BUCKET_NAME, GCS_BUCKET_NAME_PRIVATE, PROJECT_ID

from storage.provider import StorageProvider

logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger('storage.google')

class GoogleStorageProvider(StorageProvider):
    def __init__(self):
        # Load the credentials JSON from the environment variable
        credentials_json = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')
        if credentials_json:
            credentials_info = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(credentials_info)
            # Initialize the storage client with the credentials
            self.storage_client = storage.Client(credentials=credentials, project=PROJECT_ID)
        else:
            logging.warning('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.')
            self.storage_client = storage.Client(project=PROJECT_ID)

    async def init(self):
        pass

    async def create_bucket(self, bucket_name=None, options=None):
        if bucket_name is None:
            bucket_name = GCS_BUCKET_NAME
        try:
            bucket = self.storage_client.create_bucket(bucket_name, **(options or {}))
            log.debug(f'GCS Bucket {bucket.name} created.')
            return bucket
        except Exception as e:
            if e.code == 409:
                log.warning(f'Warning when creating GCS bucket: {e.message}')
            log.error(f'Failed to create GCS bucket: {e.message}')
            raise e

    def upload_file_buffer(self, buffer, filename, folder_path, is_public=False):
        log.debug('Uploading buffer content as file %s', filename)
        bucket_name = GCS_BUCKET_NAME if is_public else GCS_BUCKET_NAME_PRIVATE
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(f"{folder_path}/{filename}")
        try:
            blob.upload_from_file(buffer, rewind=True)
            log.debug('Buffer content uploaded successfully.')
            if is_public:
                blob.make_public()
        except Exception as err:
            log.error('Buffer upload error:', err)
            raise err

    def upload_local_file(self, filename, folder_path, is_public=False):
        log.debug('Uploading file %s', filename)
        bucket_name = GCS_BUCKET_NAME if is_public else GCS_BUCKET_NAME_PRIVATE
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
        bucket_name = GCS_BUCKET_NAME if is_public else GCS_BUCKET_NAME_PRIVATE
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(f"{file_folder}/{filename}")
        blob.delete()
        
    def get_signed_url(self, filename, file_folder, is_public=False):
        log.debug('Downloading file %s', filename)
        bucket_name = GCS_BUCKET_NAME if is_public else GCS_BUCKET_NAME_PRIVATE
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(f"{file_folder}/{filename}")
        signed_url= blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
        )
        return signed_url


google_storage_provider = GoogleStorageProvider()