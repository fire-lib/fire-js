import ParseType from './ParseType.js';
import OptionType from './OptionType.js';
import DateTime from '../time/DateTime.js';

export class StringType extends ParseType {
	static parse(val) {
		if (typeof val !== 'string') throw new Error('expected a string');

		return val;
	}
}

export class BoolType extends ParseType {
	static parse(val) {
		return !!val;
	}
}

export class IntType extends ParseType {
	static parse(val) {
		return parseInt(val);
	}
}

export class FloatType extends ParseType {
	static parse(val) {
		return parseFloat(val);
	}
}

export class AnyType extends ParseType {
	static parse(val) {
		return val;
	}
}

export class UniqueIdType extends ParseType {
	static parse(val) {
		if (typeof val !== 'string' || val.length !== 14)
			throw new Error('expected uid');
		return val;
	}
}

export function typeFromStr(type) {
	// allow for optstr
	if (type.length > 3 && type.slice(0, 3) === 'opt')
		return new OptionType(typeFromStr(type.slice(3)));

	switch (type) {
		case 'arr':
			throw new Error('use [] instead');
		case 'uid':
			return UniqueIdType;
		case 'str':
			return StringType;
		case 'bool':
			return BoolType;
		case 'int':
			return IntType;
		case 'float':
			return FloatType;
		case 'datetime':
			return DateTime;
		case 'any':
			return AnyType;
		default:
			throw new Error(`unrecognized type ${type}`);
	}
}

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
