from google.cloud import secretmanager
from utils.log_exception_context_manager import raise_exception
import google.auth


def access_secret(secret_id: str, version_id: str = "latest"):
    with raise_exception():
        credentials, PROJECT_ID = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        name = f"projects/{PROJECT_ID}/secrets/{secret_id}/versions/{version_id}"
        client = secretmanager.SecretManagerServiceClient()
        response = client.access_secret_version(
            request={
                "name": name
            }
        )
        payload = response.payload.data.decode('UTF-8')
        return payload


if __name__ == '__main__':
    print("Loading {} Module Individually".format(
        __file__))
