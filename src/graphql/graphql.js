import GraphQlError, { isGraphQlErrorObject } from './error.js';

export default class GraphQl {
	constructor(url = null) {
		this.url = url;
	}

	async request(query, variables = {}, headers = {}) {
		if (!this.url) throw GraphQlError.newOther('GraphQl url not defined');

		headers['content-type'] = 'application/json';

		let resp;
		try {
			resp = await fetch(this.url, {
				headers,
				method: 'POST',
				body: JSON.stringify({
					query,
					variables,
				}),
			});

			const json = await resp.json();
			if (
				'errors' in json &&
				Array.isArray(json.errors) &&
				json.errors.length
			)
				throw GraphQlError.fromJson(json);

			if (!resp.ok)
				throw new GraphQlError('NotOk', 'response code ' + resp.status);

			return json?.data ?? null;
		} catch (e) {
			if (isGraphQlErrorObject(e)) {
				console.log('graphql Errors', e.toString());
				throw e;
			}

			throw new GraphQlError('Unknown', {
				message: e.toString(),
				extensions: {
					nativeError: e,
				},
			});
		}
	}
}
