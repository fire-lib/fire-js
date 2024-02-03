import { typeFromStr } from './parsetypes.js';

export function parseType(type, val) {
	switch (typeof type) {
		case 'object':
		case 'function':
			if (typeof type.__parsetype__ === 'function')
				return type.parse(val);

			if (typeof type.__data__ === 'function') return new type(val);

			if (Array.isArray(type)) {
				if (type.length === 1) return parseArray(type[0], val);
				return parseTuple(type, val);
			}

			throw new Error(`unrecognized object type ${type}`);

		case 'string':
			return parseType(typeFromStr(type), val);

		default:
			throw new Error(`unrecognized ${typeof type} of type`);
	}
}

export function parseTypeDefault(type) {
	switch (typeof type) {
		case 'object':
		case 'function':
			if (typeof type.__allowedUndefined__ === 'function')
				return parseType(type, type.default());

			throw new Error(`unrecognized object type ${type}`);

		case 'string':
			return parseTypeDefault(typeFromStr(type));

		default:
			throw new Error(`unrecognized ${typeof type} of type`);
	}
}

function parseArray(type, arr) {
	if (!Array.isArray(arr)) throw new Error('Expected array');

	return arr.map(val => {
		return parseType(type, val);
	});
}

function parseTuple(types, arr) {
	if (!Array.isArray(arr)) throw new Error('Expected tuple');

	if (types.length !== arr.length)
		throw new Error('tuple not the same length');

	return arr.map((val, idx) => {
		return parseType(types[idx], val);
	});
}
