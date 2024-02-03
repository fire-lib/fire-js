/**
 * @module data/datetime
 */

import { padZero } from './../util.js';
import { fromAny } from './localization.js';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function isDateTimeObject(val) {
	return typeof (val ? val.__isDateTimeObject__ : null) === 'function';
}

/**
 * Class representing a DateTime object
 * @class
 * @exports data/datetime/DateTime
 * */
export default class DateTime {
	static __parsetype__() {}
	__isDateTimeObject__() {}
	static parse(val) {
		if (
			typeof val !== 'string' &&
			typeof val !== 'number' &&
			!isDateTimeObject(val)
		)
			throw new Error('expected a string or a number');

		return new DateTime(val);
	}

	/**
	 * Create a new DateTime instance
	 * @constructor
	 * @param {Date|DateTime|string|number} date - The date value. Default is
	 * current date/time.
	 * If it's a string or number, convert it to a date.
	 * @throws {Error} Will throw an error if date is an invalid Date.
	 */
	constructor(date = null) {
		if (typeof date === 'undefined' || date === null) {
			this.raw = new Date();
			return;
		}

		if (isDateTimeObject(date)) date = date.raw;

		if (date instanceof Date) {
			this.raw = date;
			return;
		}

		this.raw = new Date(date);

		if (isNaN(this.raw)) throw new Error('invalid Date');
	}

	/**
	 * Create a new DateTime instance representing today's date
	 * @static
	 * @returns {DateTime} A DateTime object representing today's date with the
	 * time set to 0
	 */
	static today() {
		const date = new DateTime();
		date.raw.setHours(0, 0, 0, 0);
		return date;
	}

	/**
	 * Check if the date represented by this instance is today
	 * @returns {boolean} True if the date represented by this instance is
	 * today, otherwise false
	 */
	isToday() {
		const today = new DateTime();
		return (
			this.year == today.year &&
			this.month == today.month &&
			this.date == today.date
		);
	}

	/**
	 * Get the year from the date ex: 2023
	 * @returns {number} The year in which the date occurs
	 */
	get year() {
		return this.raw.getFullYear();
	}

	/**
	 * Get the month from the date (0 indexed)
	 * @returns {number} The month in which the date occurs, zero-indexed
	 */
	get month() {
		return this.raw.getMonth();
	}

	/**
	 * Get the date (day of the month 1-31)
	 * @returns {number} The day of the month on which the date occurs
	 */
	get date() {
		return this.raw.getDate();
	}

	/**
	 * Get the week of the year
	 * @returns {number} The week of the year in which the date occurs
	 */
	get week() {
		const nearestThursday = this.cloneDay();
		nearestThursday.raw.setDate(this.date + 4 - this.dayMoToSu);
		const firstDay = new DateTime(new Date(this.year, 0, 1));
		const days = (nearestThursday.time - firstDay.time) / DAY_IN_MS;
		return Math.ceil((days + 1) / 7);
	}

	/**
	 * Get the day of the week (0 indexed)
	 * @returns {number} The day of the week on which the date occurs,
	 * zero-indexed with 0 for Sunday
	 */
	get day() {
		return this.raw.getDay();
	}

	/**
	 * Get the day of the week (1 indexed with Monday as 1)
	 * @returns {number} The day of the week on which the date occurs, with 1
	 * for Monday and 7 for Sunday
	 */
	get dayMoToSu() {
		return this.day || 7;
	}

	/**
	 * Get the hours part of the date
	 * @returns {number} The hour of the day on which the date occurs, from 0
	 * to 23
	 */
	get hours() {
		return this.raw.getHours();
	}

	/**
	 * Get the minutes part of the date
	 * @returns {number} The minute of the hour on which the date occurs, from
	 * 0 to 59
	 */
	get minutes() {
		return this.raw.getMinutes();
	}

	/**
	 * Get the seconds part of the date
	 * @returns {number} The second of the minute on which the date occurs,
	 * from 0 to 59
	 */
	get seconds() {
		return this.raw.getSeconds();
	}

	/**
	 * Get the milliseconds part of the date
	 * @returns {number} The milliseconds of the second on which the date
	 * occurs, from 0 to 999
	 */
	get millis() {
		return this.raw.getMilliseconds();
	}

	/**
	 * Get the number of milliseconds since 1 January 1970 00:00:00 UTC
	 * @returns {number} The number of milliseconds since the Unix Epoch
	 */
	get time() {
		return this.raw.getTime();
	}

	/**
	 * Create a new DateTime object representing the same day
	 * @returns {DateTime} A new DateTime object with the same year, month, and
	 * date
	 */
	cloneDay() {
		return new DateTime(new Date(this.year, this.month, this.date));
	}

	/**
	 * Get the name of the month in a given language
	 * @param {string|null} lang - The language to get the month name in
	 * @returns {string|null} The name of the month in the given language,
	 * or null if the language is not provided
	 */
	toStrMonth(lang = null) {
		const l = fromAny(lang);
		return (l && l.months[this.month]) ?? null;
	}

	/**
	 * Get the name of the day in a given language
	 * @param {string|null} lang - The language to get the day name in
	 * @returns {string|null} The name of the day in the given language,
	 * or null if the language is not provided
	 */
	toStrDay(lang = null) {
		const l = fromAny(lang);
		return (l && l.days[this.day]) ?? null;
	}

	/**
	 * Get the first letter of the day in a given language, in uppercase
	 * @param {string|null} lang - The language to get the day name in
	 * @returns {string|null} The first letter of the day in the given
	 * language, or null if the language is not provided
	 */
	toStrDayLetter(lang = null) {
		const l = fromAny(lang);
		return (l && l.daysLetter[this.day]) ?? null;
	}

	/**
	 * Get a short representation of the date (dd.mm)
	 * @returns {string} A string representing the date in the form dd.mm
	 */
	toStrShortDate() {
		return `${padZero(this.date)}.${padZero(this.month + 1)}`;
	}

	/**
	 * Get a representation of the date (dd.mm.yyyy)
	 * @returns {string} A string representing the date in the form dd.mm.yyyy
	 */
	toStrDate() {
		const month = padZero(this.month + 1);
		return `${padZero(this.date)}.${month}.${this.year}`;
	}

	/**
	 * Get a representation of the date suitable for a browser (yyyy-mm-dd)
	 * @returns {string} A string representing the date in the form yyyy-mm-dd
	 */
	toBrowserDate() {
		const month = padZero(this.month + 1);
		return `${this.year}-${month}-${padZero(this.date)}`;
	}

	/**
	 * Get a representation of the time with seconds (hh:mm:ss)
	 * @returns {string} A string representing the time in the form hh:mm:ss
	 */
	toStrFullTime() {
		const minutes = padZero(this.minutes);
		const seconds = padZero(this.seconds);
		return `${padZero(this.hours)}:${minutes}:${seconds}`;
	}

	/**
	 * Get a representation of the time without seconds (hh:mm)
	 * @returns {string} A string representing the time in the form hh:mm
	 */
	toStrShortTime() {
		return `${padZero(this.hours)}:${padZero(this.minutes)}`;
	}

	toJSON() {
		const str = this.raw.toISOString();
		return str.substr(0, 19) + '+00:00';
	}
}
