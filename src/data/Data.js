import { parseType, parseTypeDefault } from './parseTypes.js';

export default class Data {
	// the data will be assigned to this
	constructor(proto, data) {
		// warn about every data entry that is not in proto
		for (let key in data)
			if (!(key in proto))
				console.log(`${key} not found in prototype`, proto);

		// insert every data
		for (let key in proto) {
			if (key in data) {
				this[key] = parseType(proto[key], data[key]);
				continue;
			}

			// if the key is not found, check if is allowed to be undefined
			try {
				this[key] = parseTypeDefault(proto[key]);
			} catch (e) {
				console.log('parseTypeDefault failed', e);
				throw new Error(`field ${key} missing in data`);
			}
		}
	}

	static __data__() {}
}
