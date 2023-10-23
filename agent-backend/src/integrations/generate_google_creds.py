import hashlib
import json
import os
import re
import socket
import sys
from urllib.parse import unquote
from google_auth_oauthlib.flow import Flow
from init.env_variables import google_ads_scope
from redisClient.utilities import RedisClass


class GoogleOAuth:
    def __init__(self):
        self.scope = google_ads_scope
        self.server = "127.0.0.1"
        self.port = 8080
        self.client_secrets_path = "src/keys/google_ads_auth.json"
        self.redirect_url = f"http://{self.server}:{self.port}"
        self.flow = None
        self.passthrough_val = None
        self.authorization_url = None

    def _construct_flow(self):
        self.flow = Flow.from_client_secrets_file(self.client_secrets_path, scopes=[self.scope])
        self.flow.redirect_uri = self.redirect_url
        self.passthrough_val = hashlib.sha256(os.urandom(1024)).hexdigest()

    def get_refresh_token(self):

        # Create an anti-forgery state token as described here:
        # https://developers.google.com/identity/protocols/OpenIDConnect#createxsrftoken
        # Retrieves an authorization code by opening a socket to receive the
        # redirect request and parsing the query parameters set in the URL.
        code = unquote(self.get_authorization_code(self.passthrough_val))

        # Pass the code back into the OAuth module to get a refresh token.
        self.flow.fetch_token(code=code)
        refresh_token = self.flow.credentials.refresh_token

        return refresh_token

    def get_authorization_url(self, customer_id):

        self._construct_flow()
        state = {
            "code": self.passthrough_val,
            "customer_id": customer_id
        }

        redis_client = RedisClass()
        redis_client.insert_oauth_state(state)

        authorization_url, state = self.flow.authorization_url(
            access_type="offline",
            state=json.dumps(state),
            prompt="consent",
            include_granted_scopes="true",
        )

        # Prints the authorization URL so you can paste into your browser. In a
        # typical web application you would redirect the user to this URL, and they
        # would be redirected back to "redirect_url" provided earlier after
        # granting permission.
        print("Paste this URL into your browser: ")
        print(authorization_url)
        print(f"\nWaiting for authorization and callback to: {self.redirect_url}")
        self.authorization_url = authorization_url
        return authorization_url

    def get_authorization_code(self, passthrough_val):
        """Opens a socket to handle a single HTTP request containing auth tokens.

        Args:
            passthrough_val: an anti-forgery token used to verify the request
              received by the socket.

        Returns:
            a str access token from the Google Auth service.
        """
        # Open a socket at _SERVER:_PORT and listen for a request
        sock = socket.socket()
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((self.server, self.port))
        sock.listen(1)
        connection, address = sock.accept()
        data = connection.recv(1024)
        # Parse the raw request to retrieve the URL query parameters.
        params = self.parse_raw_query_params(data)

        try:
            if not params.get("code"):
                # If no code is present in the query params then there will be an
                # error message with more details.
                error = params.get("error")
                message = f"Failed to retrieve authorization code. Error: {error}"
                raise ValueError(message)
            elif params.get("state") != passthrough_val:
                message = "State token does not match the expected state."
                raise ValueError(message)
            else:
                message = "Authorization code was successfully retrieved."
        except ValueError as error:
            print(error)
            sys.exit(1)
        finally:
            response = (
                "HTTP/1.1 200 OK\n"
                "Content-Type: text/html\n\n"
                f"<b>{message}</b>"
                "<p>Please check the console output.</p>\n"
            )

            connection.sendall(response.encode())
            connection.close()

        return params.get("code")

    @staticmethod
    def parse_raw_query_params(data):
        """Parses a raw HTTP request to extract its query params as a dict.

        Note that this logic is likely irrelevant if you're building OAuth logic
        into a complete web application, where response parsing is handled by a
        framework.

        Args:
            data: raw request data as bytes.

        Returns:
            a dict of query parameter key value pairs.
        """
        # Decode the request into a utf-8 encoded string
        decoded = data.decode("utf-8")
        # Use a regular expression to extract the URL query parameters string
        match = re.search(r"GET\s\/\?(.*) ", decoded)
        params = match.group(1)
        # Split the parameters to isolate the key/value pairs
        pairs = [pair.split("=") for pair in params.split("&")]
        # Convert pairs to a dict to make it easy to access the values
        return {key: val for key, val in pairs}


if __name__ == "__main__":
    oauth = GoogleOAuth()
    oauth.get_refresh_token()
