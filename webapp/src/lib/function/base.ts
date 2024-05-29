// https://cloud.google.com/functions/docs/create-deploy-http-python#create_your_function
export const WrapToolCode = (x) => `import functions_framework

@functions_framework.http
def hello_http(request):
	args = request.get_json(silent=True)
	${x}
`;

// https://cloud.google.com/functions/docs/create-deploy-http-python#specify_dependencies
export const StandardRequirements = ['functions-framework==3.*'];
