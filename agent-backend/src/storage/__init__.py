import os

STORAGE_PROVIDER = os.getenv("STORAGE_PROVIDER", "local")
print(f"STORAGE_PROVIDER: {STORAGE_PROVIDER}")

if STORAGE_PROVIDER == "google":
    from .google import google_storage_provider

    storage_provider = google_storage_provider
else:
    from .local import local_storage_provider

    storage_provider = local_storage_provider
