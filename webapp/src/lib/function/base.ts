export const indent = (x, count = 1) =>
	x
		.split(/\r?\n/)
		.map(l => `${'\t'.repeat(count)}${l}`)
		.join('\n');

// https://cloud.google.com/functions/docs/create-deploy-http-python#create_your_function
export const WrapToolCode = x => `import functions_framework

@functions_framework.http
def hello_http(request):
	args = request.get_json(silent=True)
${indent(x, 1)}
`;

// https://cloud.google.com/functions/docs/create-deploy-http-python#specify_dependencies
export const StandardRequirements = ['functions-framework==3.*'];
