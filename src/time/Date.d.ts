export default class Date {
	/**
	 * Tries to creates a new Date instance
	 */
	static parse(val: any): Date;

	/**
	 * Create a new Date instance
	 * @constructor
	 * @param {Date|string|number} date - The date value. Default is
	 * current date.
	 * If it's a string or number, convert it to a date.
	 * @throws {Error} Will throw an error if date is an invalid Date.
	 */
	constructor(date?: Date | string | number);

	/**
	 * Check if the date represented by this instance is today
	 * @returns {boolean} True if the date represented by this instance is
	 * today, otherwise false
	 */
	isToday(): boolean;

	/**
	 * Get the year from the date ex: 2023
	 * @returns {number} The year in which the date occurs
	 */
	get year(): number;

	/**
	 * Get the month from the date (0 indexed)
	 * @returns {number} The month in which the date occurs, zero-indexed
	 */
	get month(): number;

	/**
	 * Get the date (day of the month 1-31)
	 * @returns {number} The day of the month on which the date occurs
	 */
	get date(): number;

	/**
	 * Get the week of the year
	 * @returns {number} The week of the year in which the date occurs
	 */
	get week(): number;

	/**
	 * Get the day of the week (0 indexed)
	 * @returns {number} The day of the week on which the date occurs,
	 * zero-indexed with 0 for Sunday
	 */
	get day(): number;

	/**
	 * Get the day of the week (1 indexed with Monday as 1)
	 * @returns {number} The day of the week on which the date occurs, with 1
	 * for Monday and 7 for Sunday
	 */
	get dayMoToSu(): number;

	/**
	 * Get the number of milliseconds since 1 January 1970 00:00:00 UTC
	 * @returns {number} The number of milliseconds since the Unix Epoch
	 */
	get time(): number;

	/**
	 * Create a new Date object representing the same day
	 * @returns {Date} A new Date object with the same year, month, and
	 * date
	 */
	clone(): Date;

	/**
	 * Get the name of the month in a given language
	 * @param {string|null} lang - The language to get the month name in
	 * @returns {string|null} The name of the month in the given language,
	 * or null if the language is not provided
	 */
	toStrMonth(lang?: string | null): string | null;

	/**
	 * Get the name of the day in a given language
	 * @param {string|null} lang - The language to get the day name in
	 * @returns {string|null} The name of the day in the given language,
	 * or null if the language is not provided
	 */
	toStrDay(lang?: string | null): string | null;

	/**
	 * Get the first letter of the day in a given language, in uppercase
	 * @param {string|null} lang - The language to get the day name in
	 * @returns {string|null} The first letter of the day in the given
	 * language, or null if the language is not provided
	 */
	toStrDayLetter(lang?: string | null): string | null;

	/**
	 * Get a short representation of the date (dd.mm)
	 * @returns {string} A string representing the date in the form dd.mm
	 */
	toStrShort(): string;

	/**
	 * Get a representation of the date (dd.mm.yyyy)
	 * @returns {string} A string representing the date in the form dd.mm.yyyy
	 */
	toStr(): string;

	/**
	 * Get a representation of the date suitable for a browser (yyyy-mm-dd)
	 * @returns {string} A string representing the date in the form yyyy-mm-dd
	 */
	toBrowserDate(): string;
}
