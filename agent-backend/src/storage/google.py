from google.cloud import storage
import os
import logging

from storage.provider import StorageProvider

logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger('storage.google')

class GoogleStorageProvider(StorageProvider):
    def __init__(self):
        options = {'projectId': os.getenv('PROJECT_ID')}
        if os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
            options['keyFilename'] = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
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

    async def upload_local_file(self, filename, uploaded_file, content_type, is_public=False):
        log.debug('Uploading file %s', filename)
        bucket_name = os.getenv('NEXT_PUBLIC_GCS_BUCKET_NAME' if is_public else 'NEXT_PUBLIC_GCS_BUCKET_NAME_PRIVATE')
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(filename)
        try:
            blob.upload_from_file(uploaded_file, content_type=content_type)
            log.debug('File uploaded successfully.')
            if is_public:
                blob.make_public()
        except Exception as err:
            log.error('File upload error:', err)
            raise err

    async def upload_buffer(self, filename, content, content_type, is_public=False):
        log.debug('Uploading buffer to file %s', filename)
        bucket_name = os.getenv('NEXT_PUBLIC_GCS_BUCKET_NAME' if is_public else 'NEXT_PUBLIC_GCS_BUCKET_NAME_PRIVATE')
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(filename)
        try:
            blob.upload_from_string(content, content_type=content_type)
            log.debug('Buffer uploaded successfully.')
            if is_public:
                blob.make_public()
        except Exception as err:
            log.error('Buffer upload error:', err)
            raise err

    async def delete_file(self, filename, is_public=False):
        log.debug('Deleting file %s', filename)
        bucket_name = os.getenv('NEXT_PUBLIC_GCS_BUCKET_NAME' if is_public else 'NEXT_PUBLIC_GCS_BUCKET_NAME_PRIVATE')
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(filename)
        blob.delete()

    def get_base_path(self, is_public=True):
        return f'https://storage.googleapis.com/{os.getenv("NEXT_PUBLIC_GCS_BUCKET_NAME" if is_public else "NEXT_PUBLIC_GCS_BUCKET_NAME_PRIVATE")}'

google_storage_provider = GoogleStorageProvider()