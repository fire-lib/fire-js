
import { parseType } from './parsetype.js';
import ParseType from './parsetypes.js';

export default class MapType extends ParseType {
	constructor(keyType, valueType) {
		super();
		this.keyType = keyType;
		this.valueType = valueType;
	}

	// returns an obj, {}
	parse(val) {
		if (typeof val !== 'object' || val === null || Array.isArray(val))
			throw new Error('expected an object');

		const obj = {};

		for (const rawKey in val) {
			const key = parseType(this.keyType, rawKey);
			const value = parseType(this.valueType, val[rawKey]);
			obj[key] = value;
		}

		return obj;
	}
}