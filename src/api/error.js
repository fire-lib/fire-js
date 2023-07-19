
export default class ApiError {
	/*
	fields:
		- kind: str,
		- data: any // if it has a toString (it will be stored it in the msg)
	*/
	constructor(kind, data) {
		this.kind = kind;
		this.data = data;
	}

	get msg() {
		if (this.data && typeof this.data.toString === 'function')
			return this.data.toString();
		return '';
	}

	__isApiErrorObject__() {}

	/// expects either
	/// str
	/// { 'kind': data }
	/// { kind, data }
	static fromJson(obj) {
		if (typeof obj === 'string')
			return new ApiError(obj, null);

		// {kind, data}
		if ('kind' in obj)
			return new ApiError(obj.kind, obj?.data ?? null);

		// {'kind': data}
		const [kind, data] = Object.entries(obj)[0];
		return new ApiError(kind, data);
	}

	static newOther(msg) {
		return new ApiError('Other', msg);
	}

	static newSessionError() {
		return new ApiError('SessionNotFound', 'no session');
	}

	toString() {
		return `${ this.kind }: ${ this.msg }`;
	}
}

export function isApiErrorObject(val) {
	return typeof (val ? val.__isApiErrorObject__ : null) === 'function';
}