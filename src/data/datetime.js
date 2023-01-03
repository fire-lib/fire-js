import { padZero } from './../util.js';
import { fromAny } from './localization.js';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function isDateTimeObject(val) {
	return typeof (val ? val.__isDateTimeObject__ : null) === 'function';
}

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

	constructor(date = null) {
		if (typeof date === 'undefined' || date === null) {
			this.raw = new Date;
			return;
		}

		if (isDateTimeObject(date))
			date = date.raw;

		if (date instanceof Date) {
			this.raw = date;
			return;
		}

		this.raw = new Date(date);

		if (isNaN(this.raw))
			throw new Error('invalid Date');
	}

	/// return a date with the time set to 0
	static today() {
		const date = new DateTime;
		date.raw.setHours(0, 0, 0, 0);
		return date;
	}

	isToday() {
		const today = new DateTime;
		return this.year == today.year &&
			this.month == today.month &&
			this.date == today.date;
	}

	// ex: 2021
	get year() {
		return this.raw.getFullYear();
	}

	// 0 - 11
	get month() {
		return this.raw.getMonth();
	}

	// 1 - 31
	get date() {
		return this.raw.getDate();
	}

	get week() {
		const nearestThursday = this.cloneDay();
		nearestThursday.raw.setDate(this.date + 4 - this.dayMoToSu);
		const firstDay = new DateTime(new Date(this.year, 0, 1));
		const days = (nearestThursday.time - firstDay.time) / DAY_IN_MS;
		return Math.ceil((days + 1) / 7);
	}

	// 0: Sunday - 6
	get day() {
		return this.raw.getDay();
	}

	// 1: Monday - 7
	get dayMoToSu() {
		return this.day || 7;
	}

	// 0 - 23
	get hours() {
		return this.raw.getHours();
	}

	// 0 - 59
	get minutes() {
		return this.raw.getMinutes();
	}

	// 0 - 59
	get seconds() {
		return this.raw.getSeconds();
	}

	// 0 - 999
	get millis() {
		return this.raw.getMilliseconds();
	}

	// millis since 1 januar 1970 00:00:00 UTC
	get time() {
		return this.raw.getTime();
	}

	cloneDay() {
		return new DateTime(new Date(this.year, this.month, this.date));
	}

	toStrMonth(lang = null) {
		const l = fromAny(lang);
		return l && l.months[this.month];
	}

	toStrDay(lang = null) {
		const l = fromAny(lang);
		return l && l.days[this.day];
	}

	// returns only one letter
	// in uppercase
	toStrDayLetter(lang = null) {
		const l = fromAny(lang);
		return l && l.daysLetter[this.day];
	}

	// 22.06
	// maybe need to check which country?
	toStrShortDate() {
		return `${ padZero(this.date) }.${ padZero(this.month + 1) }`;
	}

	// 22.06.2020
	// maybe need to check which country?
	toStrDate() {
		return `${ padZero(this.date) }.${ padZero(this.month + 1) }.${ this.year }`;
	}

	// 2020-06-22
	toBrowserDate() {
		return `${ this.year }-${ padZero(this.month + 1) }-${ padZero(this.date) }`;
	}

	toStrFullTime() {
		return `${ padZero(this.hours) }:${ padZero(this.minutes) }:${ padZero(this.seconds) }`;
	}

	toStrShortTime() {
		return `${ padZero(this.hours) }:${ padZero(this.minutes) }`;
	}

	toJSON() {
		const str = this.raw.toISOString();
		return str.substr(0, 19) + '+00:00';
	}
}