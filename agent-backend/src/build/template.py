import logging
from jinja2 import FileSystemLoader, exceptions
from jinja2.sandbox import SecurityError, Environment
from init.env_variables import BASE_PATH


class Org:

    def __init__(self, session_id: str, org_structure: dict):
        self.session_id = session_id
        self.org = org_structure

    @property
    def _load_template(self):
        try:
            def format_role_name(role_name: str):
                name: str = (role_name.replace(" ", "_")
                             .replace("(", "")
                             .replace(")", "")
                             .replace("#", ""))
                return name.lower()

            env = Environment(loader=FileSystemLoader(f"{BASE_PATH}/templates/"))
            env.filters['format_role_name'] = format_role_name
            template = env.get_template("base.txt")
            return template
        except exceptions.TemplateNotFound as tnf:
            logging.exception(tnf)
        except SecurityError as se:
            logging.warning("This template contains unsafe code")
            logging.exception(se)

    @property
    def _build_units(self):
        try:
            code = self._load_template.render(session_id=self.session_id, **self.org)
            return code
        except Exception as e:
            logging.exception(e)

    def save_org_structure(self):
        try:
            with open(f"{BASE_PATH}/orgs/{self.session_id}.py", "w") as f:
                f.write(self._build_units)
            return True
        except Exception as e:
            logging.exception(e)
            raise Exception(e)
