
export default class ApiError {
	/*
	fields:
		- kind: str,
		- msg: str|null
	*/
	constructor(kind, msg) {
		this.kind = kind;
		this.msg = msg;
	}

	static fromJson(obj) {
		if (typeof obj === 'string')
			return new ApiError(obj, null);
		const [kind, msg] = Object.entries(obj)[0];
		return new ApiError(kind, msg);
	}

	static newSessionError() {
		return new ApiError('SessionNotFound', 'no session');
	}

	toString() {
		return `${ this.kind }: ${ this.msg }`;
	}
}