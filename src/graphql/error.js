import ApiError from '../api/error.js';

export default class GraphQlError {
	/*
	fields:
		- kind: str,
		- errors: should be one of the following
		  "error message"
		  { message, ?extensions, ?locations }
		  [{ message, ?extensions, ?locations }]
		- data: graphql data if it is available

		extensions might contain apiError
	*/
	constructor(kind, errors, data = null) {
		this.kind = kind;

		if (typeof errors === 'string')
			errors = [{ message: errors }];
		if (Array.isArray(errors))
			errors = errors;
		else
			errors = [errors];

		this.errors = errors;
		this.data = data;
	}

	static fromJson(json) {
		let apiError = json.errors.find(e => !!e.extensions?.apiError);
		if (apiError)
			apiError = ApiError.fromJson(apiError.extensions.apiError);

		return new GraphQlError(
			apiError?.kind ?? 'Unknown',
			json.errors,
			json.data
		);
	}

	static newOther(msg) {
		return new GraphQlError('Other', msg);
	}

	get msg() {
		return this.errors.map(e => e.message).join(', ');
	}

	toString() {
		return `${this.kind}: ${this.msg}`;
	}

	__isGraphQlErrorObject__() {}
}

export function isGraphQlErrorObject(val) {
	return typeof (val ? val.__isGraphQlErrorObject__ : null) === 'function';
}