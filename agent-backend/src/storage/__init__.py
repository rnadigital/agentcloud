from .google import google_storage_provider
from .local import local_storage_provider
import os

STORAGE_PROVIDER = os.getenv('STORAGE_PROVIDER', 'local')

if STORAGE_PROVIDER == 'google':
    storage_provider = google_storage_provider
else:
    storage_provider = local_storage_provider

