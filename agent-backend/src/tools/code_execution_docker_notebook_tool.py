from .code_execution_tool import CodeExecutionTool

import logging
import re
import inspect
import json

from typing import Dict, Any

from io import BytesIO

try:
    import docker
except ImportError:
    docker = None


def remove_triple_quotes(text):
    # This regex pattern matches triple quotes and any content between them
    # It handles both single (''') and double (""") triple quotes
    pattern = r"(\'\'\'[\s\S]*?\'\'\'|\"\"\"[\s\S]*?\"\"\")"
    # Substitute found patterns with an empty string
    return re.sub(pattern, "", text)


class CodeExecutionUsingDockerNotebookTool(CodeExecutionTool):

    def _run(self, args_str: Dict):

        args = json.loads(args_str)
        self.execute_function_in_docker(self.function_name, self.code, args)

    def execute_function_in_docker(
        self,
        function_name: str,
        function_code: Any,
        function_arguments: dict,
        use_docker=True,
        timeout=300,
    ):
        try:
            code = inspect.getsource(function_code)
            code = remove_triple_quotes(code)
            function_to_run = f"""
    c=\"\"\"
    {code}

    {function_name}(**{function_arguments})
    \"\"\"

    from PIL import Image
    import base64
    from io import BytesIO
    import os
    import queue
    import re
    from jupyter_client import KernelManager, find_connection_file
    from typing import Optional, Union

    def clean_ansi_codes(input_string):
        ansi_escape = re.compile(r'(\x9B|\x1B[|\u001b[)[0-?][ -/][@-~])')
        return ansi_escape.sub('', input_string)


    def jupyter_execution(code) -> tuple[Optional[str], Union[str, Image.Image]]:
        km = KernelManager()
        from subprocess import PIPE
        km.start_kernel(stdout=PIPE, stderr=PIPE)

        kernel = km.blocking_client()
        kernel.start_channels()

        res = ""
        res_type = None
        code = (code.replace("<|observation|>", "")
                .replace("<|assistant|>interpreter", "")
                .replace("<|assistant|>", "")
                .replace("<|user|>", "")
                .replace("<|system|>", "")
                )

        kernel.execute(code)

        try:
            msg = kernel.get_shell_msg(timeout=30)
            io_msg_content = kernel.get_iopub_msg(timeout=30)['content']
            while True:
                output = io_msg_content
                # Poll the message
                try:
                    io_msg_content = kernel.get_iopub_msg(timeout=30)['content']
                    if 'execution_state' in io_msg_content and io_msg_content['execution_state'] == 'idle':
                        break
                except queue.Empty:
                    break

            if msg['metadata']['status'] == "timeout":
                return res_type, 'Timed out'
            elif msg['metadata']['status'] == 'error':
                try:
                    error_msg = msg['content']['traceback']
                except:
                    try:
                        error_msg = msg['content']['traceback'][-1].strip()
                    except:
                        error_msg = "Traceback Error"
                return res_type, clean_ansi_codes('\\n'.join(error_msg))

            if 'text' in output:
                res_type = "text"
                res = output['text']
            elif 'data' in output:
                for key in output['data']:
                    if 'text/plain' in key:
                        res_type = "text"
                        res = output['data'][key]
                    elif 'image/png' in key:
                        res_type = "image"
                        res = output['data'][key]
                        break

            if res_type == "image":
                return 'data:image/png;base64,' + res
            elif res_type == "text" or res_type == "traceback":
                res = res
                return res
            return res
        except Exception as e:
            print(e)

    print(jupyter_execution(c))

        """

            print(function_to_run)

            # Create a docker client
            client = docker.from_env()

            # Define the image list
            image_list = (
                ["python:3"]
                if use_docker is True
                else [use_docker] if isinstance(use_docker, str) else use_docker
            )

            # Setup Docker image
            for image in image_list:
                try:
                    client.images.get(image)
                    break
                except docker.errors.ImageNotFound:
                    print("Pulling image", image)
                    try:
                        client.images.pull(image)
                        break
                    except docker.errors.DockerException:
                        print("Failed to pull image", image)

            # Create a Dockerfile
            dockerfile = """
                    FROM python:3.10
                    RUN pip install --upgrade pip ipython ipykernel
                    RUN ipython kernel install --name "python3" --user
                    RUN pip install pillow jupyter-client numpy pandas matplotlib yfinance
                    """

            # Build Docker image
            f = BytesIO(dockerfile.encode("utf-8"))
            image, build_logs = client.images.build(fileobj=f, rm=True, tag="python3")

            # Create and run the Docker container
            container = client.containers.run(
                image=image,
                command=["python", "-c", function_to_run],
                detach=True,
            )

            # Wait for the container to finish execution
            exit_code = container.wait(timeout=timeout)["StatusCode"]
            print(f"Function Execution finished with exit code: {exit_code}")

            # Retrieve the logs (output)
            try:
                logs = container.logs().decode("utf-8").rstrip()
            except UnicodeDecodeError:
                # Fallback to replace problematic characters
                logs = container.logs().decode("utf-8", errors="replace").rstrip()

            # Cleanup
            container.remove()

            # Return the logs
            return logs
        except Exception as e:
            logging.exception(e)
            raise
