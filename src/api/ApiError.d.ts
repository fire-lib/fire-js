export default class ApiError {
	/**
	 * The kind of error
	 */
	kind: string;

	/**
	 * The data associated with this error
	 *
	 * should provide a toString method
	 */
	data: any;

	/**
	 * Creates a new ApiError
	 */
	constructor(kind: string, data: any);

	/**
	 * The message of the error
	 *
	 * @returns {string}
	 */
	get msg(): string;

	/**
	 * Creates a new ApiError with the kind 'OTHER'
	 */
	static newOther(data: any): ApiError;

	/**
	 * Creates a new ApiError with the kind 'SESSION_NOT_FOUND'
	 */
	static newSessionError(): ApiError;

	/**
	 * Returns a string representation of the error
	 */
	toString(): string;
}

/**
 * Returns whether the value is an ApiError object
 *
 * @returns {boolean}
 */
export function isApiErrorObject(value: any): boolean;
