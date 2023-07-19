
import { parseType } from './parsetype.js';
import DateTime from './datetime.js';

export default class ParseType {
	static __parsetype__() {}
	static parse(_data) {
		throw new Error('static parse not implemented');
	}

	__parsetype__() {}
	parse(_data) {
		throw new Error('parse not implemented');
	}
}

export class StringType extends ParseType {
	static parse(val) {
		if (typeof val !== 'string')
			throw new Error('expected a string');
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

export class Option extends ParseType {
	constructor(innerType) {
		super();
		this.innerType = innerType;
	}

	parse(val) {
		if (typeof val === 'undefined' || val === null)
			return null;
		return parseType(this.innerType, val);
	}

	default() {
		return null;
	}

	__allowedUndefined__() {}
}

export function typeFromStr(type) {
	// allow for optstr
	if (type.length > 3 && type.slice(0, 3) === 'opt')
		return new Option(typeFromStr(type.slice(3)));

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
			throw new Error(`unrecognized type ${ type }`);
	}
}