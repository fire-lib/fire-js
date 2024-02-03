export default class ParseType {
	static __parsetype__() {}
	static parse(_data) {
		throw new Error('static parse not implemented');
	}

	__parsetype__() {}
	parse(_data) {
		throw new Error('parse not implemented');
	}
}
