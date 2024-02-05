export default class DateTime {
	/**
	 * Tries to creates a new DateTime instance
	 */
	static parse(val: any): DateTime;

	/**
	 * Create a new DateTime instance
	 * @constructor
	 * @param {Date|DateTime|string|number} date - The date value. Default is
	 * current date/time.
	 * If it's a string or number, convert it to a date.
	 * @throws {Error} Will throw an error if date is an invalid Date.
	 */
	constructor(date?: Date | DateTime | string | number);

	/**
	 * Create a new DateTime instance representing today's date
	 * @static
	 * @returns {DateTime} A DateTime object representing today's date with the
	 * time set to 0
	 */
	static today(): DateTime;

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
	 * Get the hours part of the date
	 * @returns {number} The hour of the day on which the date occurs, from 0
	 * to 23
	 */
	get hours(): number;

	/**
	 * Get the minutes part of the date
	 * @returns {number} The minute of the hour on which the date occurs, from
	 * 0 to 59
	 */
	get minutes(): number;

	/**
	 * Get the seconds part of the date
	 * @returns {number} The second of the minute on which the date occurs,
	 * from 0 to 59
	 */
	get seconds(): number;

	/**
	 * Get the milliseconds part of the date
	 * @returns {number} The milliseconds of the second on which the date
	 * occurs, from 0 to 999
	 */
	get millis(): number;

	/**
	 * Get the number of milliseconds since 1 January 1970 00:00:00 UTC
	 * @returns {number} The number of milliseconds since the Unix Epoch
	 */
	get time(): number;

	/**
	 * Create a new DateTime object representing the same day
	 * @returns {DateTime} A new DateTime object with the same year, month, and
	 * date
	 */
	cloneDay(): DateTime;

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
	toStrShortDate(): string;

	/**
	 * Get a representation of the date (dd.mm.yyyy)
	 * @returns {string} A string representing the date in the form dd.mm.yyyy
	 */
	toStrDate(): string;

	/**
	 * Get a representation of the date suitable for a browser (yyyy-mm-dd)
	 * @returns {string} A string representing the date in the form yyyy-mm-dd
	 */
	toBrowserDate(): string;

	/**
	 * Get a representation of the time with seconds (hh:mm:ss)
	 * @returns {string} A string representing the time in the form hh:mm:ss
	 */
	toStrFullTime(): string;

	/**
	 * Get a representation of the time without seconds (hh:mm)
	 * @returns {string} A string representing the time in the form hh:mm
	 */
	toStrShortTime(): string;
}
