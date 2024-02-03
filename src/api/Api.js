import ApiError from './ApiError.js';

/**
 * Api class to handle requests to a server
 */
export default class Api {
	constructor(addr = null) {
		this.addr = addr;
	}

	/**
	 * Prepares a json object to be sent as a header
	 */
	static jsonHeader(data) {
		return encodeURIComponent(JSON.stringify(data));
	}

	/**
	 * Send a request to the server
	 *
	 * @param {string} method - The method of the request
	 * @param {string} path - The path of the request
	 * @param {object|null} data - The data to be sent
	 * @param {object} headers - The headers to be sent
	 * @param {object} opts - The additional options to be sent to fetch
	 */
	async request(method, path, data = null, headers = {}, opts = {}) {
		let err;

		if (!this.addr) throw ApiError.newOther('Server addr not defined');

		try {
			let fetchParams = {
				headers,
				method,
				...opts,
			};
			fetchParams.headers['content-type'] = 'application/json';

			// don't send a body if the method is get
			if (method.toLowerCase() !== 'get')
				fetchParams.body = JSON.stringify(data);

			const resp = await fetch(this.addr + path, fetchParams);

			if (resp.status === 200) {
				return await resp.json();
			} else {
				// we've got and error
				const errObj = await resp.json();
				err = ApiError.fromJson(errObj);
			}
		} catch (e) {
			console.error('request error raw', e);
			err = ApiError.newOther(e.message);
		}

		console.error('request error', err);
		throw err;
	}

	/**
	 * Send a request to the server with a file
	 *
	 * @param {string} method - The method of the request
	 * @param {string} path - The path of the request
	 * @param {File} file - The file to be sent
	 * @param {function|null} progress - The progress callback
	 * @param {object} headers - The headers to be sent
	 */
	async requestWithFile(method, path, file, progress = null, headers = {}) {
		if (!progress) progress = () => {};

		if (!this.addr) throw ApiError.newOther('Server addr not defined');

		return new Promise((res, err) => {
			// use XMLHttpRequest since with fetch we cannot track the upload
			const req = new XMLHttpRequest();

			req.responseType = 'json';

			req.addEventListener('load', () => {
				progress(100);

				// should probably be a json object now
				if (req.status === 200) {
					res(req.response);
				} else {
					try {
						err(ApiError.fromJson(req.response));
					} catch (e) {
						err(ApiError.newOther(e.message));
					}
				}
			});

			req.addEventListener('error', () => {
				console.error('file request error', req.error);
				err(req.error);
			});

			// to manually 'estimate the progress';
			let prevProgress = 0;
			req.addEventListener('progress', e => {
				if (e.lengthComputable) {
					progress(Math.min((e.loaded / e.total) * 100, 100));
				} else {
					prevProgress += prevProgress >= 75 ? 5 : 25;
					progress(Math.min(prevProgress, 100));
				}
			});

			// open request
			req.open(method, this.addr + path);

			// add headers
			Object.entries(headers).forEach(([k, v]) => {
				req.setRequestHeader(k, v);
			});

			// send request
			req.send(file);
		});
	}

	/**
	 * Send a request to the server with a timeout
	 *
	 * @param {string} method - The method of the request
	 * @param {string} path - The path of the request
	 * @param {object|null} data - The data to be sent
	 * @param {object} headers - The headers to be sent
	 * @param {number} timeout - The timeout of the request if the value is 0 there is no timeout
	 */
	async requestTimeout(method, path, data = null, headers = {}, timeout = 0) {
		if (!this.addr) throw ApiError.newOther('Server addr not defined');

		return new Promise((res, err) => {
			// use XMLHttpRequest since with fetch we cannot track the upload
			const req = new XMLHttpRequest();

			req.responseType = 'json';

			req.addEventListener('load', () => {
				// should probably be a json object now
				if (req.status === 200) {
					res(req.response);
				} else {
					try {
						err(ApiError.fromJson(req.response));
					} catch (e) {
						err(ApiError.newOther(e.message));
					}
				}
			});

			req.addEventListener('timeout', () => {
				console.error('requested TimedOut', req.error);
				err(req.error);
			});

			req.addEventListener('error', () => {
				console.error('requestTimeout error', req.error);
				err(req.error);
			});

			// open request
			req.open(method, this.addr + path);

			// add headers
			req.setRequestHeader('content-type', 'application/json');
			Object.entries(headers).forEach(([k, v]) => {
				req.setRequestHeader(k, v);
			});
			req.timeout = timeout;

			let body = null;
			// don't send a body if the method is get
			if (method.toLowerCase() !== 'get') {
				body = JSON.stringify(data);
			}

			// send request
			req.send(body);
		});
	}
}
