export default function getDotProp(obj, prop) {
	return prop.split('.').reduce((a, b) => {
		if (a && a[b]) {
			return a[b];
		}
		return null;
	}, obj);
}
