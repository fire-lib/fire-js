/**
 * Delays for a specified amount of time.
 *
 * @param ms - The number of milliseconds to delay for.
 * @returns A promise that resolves after the delay.
 */
export declare function timeout(ms: number): Promise<void>;

/**
 * Comparison function for sorting in descending order.
 *
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @returns -1 if a > b, 1 if b > a, 0 otherwise.
 */
export declare function sortToLower(a: any, b: any): number;

/**
 * Comparison function for sorting in ascending order.
 *
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @returns 1 if a > b, -1 if b > a, 0 otherwise.
 */
export declare function sortToHigher(a: any, b: any): number;

/**
 * Pads a value with leading zeros until it reaches a specified length.
 *
 * @param val - The value to pad.
 * @param length - The desired length of the padded value.
 * @returns The padded value as a string.
 */
export declare function padZero(val: any, length?: number): string;

export declare const ALPHABET: string;
export declare const ALPHABET_LENGTH: number;

/**
 * Generates a random token of a specified length.
 *
 * @param {number} [length=8] - The desired length of the token.
 * @returns {string} A random token.
 */
export declare function randomToken(length?: number): string;

/**
 * Creates an array of whole numbers in a specified range.
 *
 * @param {number} start - The start of the range.
 * @param {number} end - The end of the range (exclusive).
 * @param {number} [step=1] - The step size between values.
 * @returns {number[]} The generated array.
 */
export declare function range(
	start: number,
	end: number,
	step?: number,
): number[];

/**
 * Selects a random element from an array, or returns null if the array is
 * empty.
 *
 * @param {*[]} arr - The array to select from.
 * @returns {*} A random element from the array, or null.
 */
export declare function randomEl<T>(arr: T[]): T | null;

/**
 * Checks how closely a search string matches a value, and returns a score
 * representing the match quality.
 *
 * @param {string} search - The search string.
 * @param {string} val - The value to check for a match.
 * @returns {number} 0 if no match, 1+ if there was a match (lower is better).
 */
export declare function searchScore(search: string, val: string): number;

/**
 * Calculates the sum of all numbers in an array.
 *
 * @param {number[]} ar - The array of numbers to sum.
 * @returns {number} The sum of all numbers in the array.
 */
export declare function sum(ar: number[]): number;
