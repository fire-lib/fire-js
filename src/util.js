/** @module util */

/**
 * Delays for a specified amount of time.
 *
 * @param {number} ms - The number of milliseconds to delay for.
 * @returns {Promise} A promise that resolves after the delay.
 */
export function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Comparison function for sorting in descending order.
 *
 * @param {*} a - The first value to compare.
 * @param {*} b - The second value to compare.
 * @returns {number} -1 if a > b, 1 if b > a, 0 otherwise.
 */
export function sortToLower(a, b) {
	if (a > b)
		return -1;
	else if (b > a)
		return 1;
	return 0;
}

/**
 * Comparison function for sorting in ascending order.
 *
 * @param {*} a - The first value to compare.
 * @param {*} b - The second value to compare.
 * @returns {number} 1 if a > b, -1 if b > a, 0 otherwise.
 */
export function sortToHigher(a, b) {
	if (a > b)
		return 1;
	else if (b > a)
		return -1;
	return 0;
}

// > 0 b .. a
// < 0 a .. b

/**
 * Gets the current time in milliseconds.
 *
 * @returns {number} The current time in milliseconds.
 */
export function time() {
	return (new Date).getTime();
}

/**
 * Pads a value with leading zeros until it reaches a specified length.
 *
 * @param {*} val - The value to pad.
 * @param {number} [length=2] - The desired length of the padded value.
 * @returns {string} The padded value as a string.
 */
export function padZero(val, length = 2) {
	// make val a string
	val += '';
	if (val.length >= length)
		return val;
	let prev = '';
	for (let i = val.length; i < length; i++)
		prev += '0';
	return prev + val;
}

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const ALPHABET_LENGTH = ALPHABET.length;

/**
 * Generates a random token of a specified length.
 *
 * @param {number} [length=8] - The desired length of the token.
 * @returns {string} A random token.
 */
export function randomToken(length = 8) {
	let s = '';
	for (let i = 0; i < length; i++)
		s += ALPHABET[Math.floor(Math.random() * ALPHABET_LENGTH)];
	return s;
}

/**
 * Creates an array of whole numbers in a specified range.
 *
 * @param {number} start - The start of the range.
 * @param {number} end - The end of the range (exclusive).
 * @param {number} [step=1] - The step size between values.
 * @returns {number[]} The generated array.
 */
// todo improve this function
export function range(start, end, step = 1) {
	const len = end - start / step;
	const ar = new Array(len);
	let c = 0;
	for (let i = start; i < end; i += step) {
		ar[c] = i;
		c += 1;
	}
	return ar;
}

/**
 * Selects a random element from an array, or returns null if the array is
 * empty.
 *
 * @param {*[]} arr - The array to select from.
 * @returns {*} A random element from the array, or null.
 */
export function randomEl(arr) {
	if (arr.length === 0)
		return null;

	const i = Math.floor(Math.random() * arr.length);
	return arr[i];
}

/**
 * Checks how closely a search string matches a value, and returns a score
 * representing the match quality.
 *
 * @param {string} search - The search string.
 * @param {string} val - The value to check for a match.
 * @returns {number} 0 if no match, 1+ if there was a match (lower is better).
 */
export function match(search, val) {
	if (search.length === 0)
		return 0;

	search = search.normalize('NFKD').toLowerCase();
	val = val.normalize('NFKD').toLowerCase();

	const i = val.indexOf(search);
	// search not found in val
	if (i === -1)
		return 0;

	const distLeft = searchSpaceLeft(i, val);
	const distRight = searchSpaceLeft(i + search.length, val);

	return 1 + distLeft + distRight;
}

// calculate distance to space left of
function searchSpaceLeft(idx, val) {
	let dist = 0;
	while (idx > 0) {
		idx--;
		if (val[idx] === ' ')
			return dist;
		dist++;
	}
	return dist;
}

// calculate distance to space right of
// todo is this used???
// @ts-ignore
/* eslint-disable no-unused-vars */
function searchSpaceRight(idx, val) {
	let dist = 0;
	while (idx < val.length - 1) {
		idx++;
		if (val[idx] === ' ')
			return dist;
		dist++;
	}
	return dist;
}

/**
 * Calculates the sum of all numbers in an array.
 *
 * @param {number[]} ar - The array of numbers to sum.
 * @returns {number} The sum of all numbers in the array.
 */
export function sum(ar) {
	return ar.reduce((a, b) => a + b, 0);
}