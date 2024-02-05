import ApiError from './ApiError';

/**
 * Api class to handle requests to a server
 */
export default class Api {
	/**
	 * get or set the api address
	 */
	addr: string;

	/**
	 * Creates a new Api instance
	 */
	constructor(addr?: string);

	/**
	 * Prepares a json object to be sent as a header
	 */
	static jsonHeader(data: object): string;

	/**
	 * Send a request to the server
	 *
	 * @param {string} method - The method of the request
	 * @param {string} path - The path of the request
	 * @param {object|null} data - The data to be sent
	 * @param {object} headers - The headers to be sent
	 * @param {object} opts - The additional options to be sent to fetch
	 *
	 * @returns The response of the request
	 *
	 * @throws {ApiError} - If the request fails
	 */
	request(
		method: string,
		path: string,
		data?: object | null,
		headers?: object,
		opts?: object,
	): Promise<object>;

	/**
	 * Send a request to the server with a file
	 *
	 * @param {string} method - The method of the request
	 * @param {string} path - The path of the request
	 * @param {File} file - The file to be sent
	 * @param {function|null} progress - The progress callback
	 * @param {object} headers - The headers to be sent
	 *
	 * @throws {ApiError} - If the request fails
	 */
	requestWithFile(
		method: string,
		path: string,
		file: File,
		progress: ((event: ProgressEvent) => void) | null,
		headers: object,
	): Promise<object>;

	/**
	 * Send a request to the server with a timeout
	 *
	 * @param {string} method - The method of the request
	 * @param {string} path - The path of the request
	 * @param {object|null} data - The data to be sent
	 * @param {object} headers - The headers to be sent
	 * @param {number} timeout - The timeout of the request if the value is 0 there is no timeout
	 */
	requestTimeout(
		method: string,
		path: string,
		data?: object | null,
		headers?: object,
		timeout?: number,
	): Promise<object>;
}
