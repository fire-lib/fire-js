import ApiError from './error.js';

export default class Api {
	constructor(addr = null) {
		this.addr = addr;
	}

	static jsonHeader(data) {
		return encodeURIComponent(JSON.stringify(data));
	}

	async request(method, path, data = null, headers = {}, opts = {}) {
		let err;

		if (!this.addr)
			throw new ApiError('Other', 'Server addr not defined');

		try {
			let fetchParams = {
				headers,
				method,
				...opts
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
			console.log('request other', e);
			err = new ApiError('Other', e.message);
		}

		console.log('request error', err);
		throw err;
	}

	async requestWithFile(
		method,
		path,
		file,
		progress = null,
		headers = {}
	) {
		if (!progress)
			progress = () => {};

		if (!this.addr)
			throw new ApiError('Other', 'Server addr not defined');

		return new Promise((res, err) => {

			// use XMLHttpRequest since with fetch we cannot track the upload
			const req = new XMLHttpRequest;

			req.responseType = 'json';

			req.addEventListener('load', e => {
				progress(100);

				// should probably be a json object now
				console.log('response', req.response, req.status);
				if (req.status === 200) {
					res(req.response);
				} else {
					try {
						err(ApiError.fromJson(req.response));
					} catch (e) {
						err(new ApiError('Other', e.message));
					}
				}
			});

			req.addEventListener('error', e => {
				console.log('file request error', req.error);
				err(req.error);
			});

			// to manually 'estimate the progress';
			let prevProgress = 0;
			req.addEventListener('progress', e => {
				console.log('req progress', e);
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

	async requestTimeout(
		method,
		path,
		data = null,
		headers = {},
		timeout = 0
	) {
		if (!this.addr)
			throw new ApiError('Other', 'Server addr not defined');

		return new Promise((res, err) => {

			// use XMLHttpRequest since with fetch we cannot track the upload
			const req = new XMLHttpRequest;

			req.responseType = 'json';

			req.addEventListener('load', e => {

				// should probably be a json object now
				console.log('response', req.response, req.status);
				if (req.status === 200) {
					res(req.response);
				} else {
					try {
						err(ApiError.fromJson(req.response));
					} catch (e) {
						err(new ApiError('Other', e.message));
					}
				}
			});

			req.addEventListener('timeout', e => {
				console.log('requested TimedOut', req.error);
				err(req.error);
			});

			req.addEventListener('error', e => {
				console.log('requestTimeout error', req.error);
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
			if (method.toLowerCase() !== 'get')
				body = JSON.stringify(data);

			// send request
			req.send(body);
		});
	}
}