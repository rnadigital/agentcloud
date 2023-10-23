import importlib
import json

from fastapi import FastAPI, Response, status
from pydantic import BaseModel

from redisClient.utilities import RedisClass
from build.template import Org
import logging
from typing import Optional
from integrations.google_ads_api import google_ads_roas
from integrations.generate_google_creds import GoogleOAuth
from utils.log_exception_context_manager import log_exception
from mongo.queries import MongoClientConnection
from urllib.parse import unquote
from messaging.client import init_socket

app = FastAPI()


@app.on_event("startup")
def startup_event():
    init_socket()


class ExecuteTask(BaseModel):
    org: str
    team: str
    prompt: str
    history: Optional[dict]


class GetTeam(BaseModel):
    task: str


@app.put("/build-org/{org_name}/{team_name}")
async def build_org(org_name: str, team_name: str, response: Response):
    try:
        org = Org(org_name, team_name)
        org.save_org_structure()
        response.status_code = status.HTTP_200_OK
    except ModuleNotFoundError as mnf:
        response.status_code = status.HTTP_404_NOT_FOUND
        logging.exception(mnf)
    except Exception as e:
        logging.exception(e)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    finally:
        return response


@app.post("/execute", status_code=200)
async def execute(message: ExecuteTask, response: Response):
    try:
        module_name = f"orgs.{message.org}_{message.team}"
        loaded_module = importlib.import_module(module_name)
        loaded_module.user_proxy.reset()
        await loaded_module.user_proxy.a_initiate_chat(
            recipient=loaded_module.manager,
            clear_history=False,
            message=message.prompt,
            silent=False,
        )
        response.status_code = status.HTTP_200_OK
    except ModuleNotFoundError as mnf:
        response.status_code = status.HTTP_404_NOT_FOUND
        logging.exception(mnf)
    except Exception as e:
        logging.exception(e)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    finally:
        return response


@app.get("/", status_code=200)
async def oauth_redirect(state: Optional[str], code: Optional[str], response: Response):
    with log_exception():
        if code:
            state = json.loads(unquote(state))
            redis_client = RedisClass()
            state_exits = redis_client.get_oauth_state(state)
            if state_exits:
                mongo_client = MongoClientConnection()
                mongo_client.insert_refresh_token(state.get("customer_id"), code)
                response.status_code = status.HTTP_200_OK
            return response


@app.get("/authorization-url/{customer_id}")
async def get_authorization_url(customer_id):
    with log_exception():
        oauth = GoogleOAuth()
        url = oauth.get_authorization_url(customer_id)
        return url


@app.get("/google-ads-roas/{customer_id}")
async def get_google_ads_metrics(customer_id: str, response: Response):
    with log_exception():
        roas = google_ads_roas(customer_id)
        return response
