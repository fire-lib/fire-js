import { range } from '../util.js';

/// returns expects a hex value with 6 values `rgba(0,0,0,a)`
export function toRgba(val, alpha = 1) {
	if (!val.startsWith('#') || val.length !== 7)
		throw new Error('expected a hex value with 6 characters');

	const hex = val.substring(1);

	const values = range(0, 3)
		.map(i => parseInt(hex.substring(i * 2, i * 2 + 2), 16))
		.concat([alpha]);

	return `rgba(${values.join()})`;
}