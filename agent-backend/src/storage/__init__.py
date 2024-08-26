from .google import google_storage_provider
from .local import local_storage_provider
import os

NEXT_PUBLIC_STORAGE_PROVIDER = os.getenv('NEXT_PUBLIC_STORAGE_PROVIDER', 'local')

if NEXT_PUBLIC_STORAGE_PROVIDER == 'google':
    storage_provider = google_storage_provider
else:
    storage_provider = local_storage_provider

