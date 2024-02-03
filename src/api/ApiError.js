/**
 * An error returned from the API
 */
export default class ApiError {
	/*
	fields:
		- kind: str,
		- data: any // if it has a toString (it will be stored it in the msg)
	*/
	/**
	 * Creates a new ApiError
	 *
	 * @param {string} kind - The kind of the error should be in SCREAMING-KEBAB-CASE
	 * @param {any} data - The data of the error if it provides a toString method it will be stored in the msg
	 */
	constructor(kind, data) {
		this.kind = kind;
		this.data = data;
	}

	/**
	 * The message of the error
	 *
	 * @returns {string}
	 */
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
		if (typeof obj === 'string') return new ApiError(obj, null);

		// {kind, data}
		if ('kind' in obj) return new ApiError(obj.kind, obj?.data ?? null);

		// {'kind': data}
		const [kind, data] = Object.entries(obj)[0];
		return new ApiError(kind, data);
	}

	/**
	 * Creates a new ApiError with the kind 'OTHER'
	 */
	static newOther(msg) {
		return new ApiError('OTHER', msg);
	}

	/**
	 * Creates a new ApiError with the kind 'SESSION_NOT_FOUND'
	 */
	static newSessionError() {
		return new ApiError('SESSION_NOT_FOUND', 'no session');
	}

	/**
	 * Returns a string representation of the error
	 */
	toString() {
		return `${this.kind}: ${this.msg}`;
	}
}

/**
 * Returns whether the value is an ApiError object
 *
 * @returns {boolean}
 */
export function isApiErrorObject(val) {
	return typeof (val ? val.__isApiErrorObject__ : null) === 'function';
}
