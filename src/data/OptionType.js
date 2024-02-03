import ParseType from './ParseType.js';
import { parseType } from './parseTypes.js';

export class Option extends ParseType {
	constructor(innerType) {
		super();
		this.innerType = innerType;
	}

	parse(val) {
		if (typeof val === 'undefined' || val === null) return null;
		return parseType(this.innerType, val);
	}

	default() {
		return null;
	}

	__allowedUndefined__() {}
}
