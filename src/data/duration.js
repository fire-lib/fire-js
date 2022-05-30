
import { fromAny } from './localization.js';

export default class Duration {

	constructor(millis) {// + is in the future - is in the past
		this.millis = millis;
	}

	// from and to need to be a DateTime object
	static from(from, to) {
		return new Duration(to.time - from.time);
	}

	// to needs to be a DateTime object
	static toNow(to) {
		return new Duration(to.time - Date.now());
	}

	get seconds() {
		return this.millis / 1000;
	}

	get minutes() {
		return this.seconds / 60;
	}

	get hours() {
		return this.minutes / 60;
	}

	get days() {
		return this.hours / 24;
	}

	get weeks() {
		return this.days / 7;
	}

	/// returns null if lang is undefined or days < 1
	toStrByDays(lang = null) {// month is maybe not always accurate
		let days = this.days;
		let l = fromAny(lang);
		if (l === null)
			return null;
		l = l.intWords;

		let pre = l.afterGram;
		if (days < 0) {
			pre = l.beforeGram;
			days *= -1;
		}

		if (days < 1)
			return null;
		if (days < 7)
			return intInfo(pre, days, l.day);
		if (days < 30)
			return intInfo(pre, days / 7, l.week);
		if (days < 30 * 12)
			return intInfo(pre, days / 30, l.month);
		return intInfo(pre, days / (30 * 12), l.year);
	}

	/// lang can be a string or a lang item (see localization.js)
	/// if null == uses default set in localization
	toStr(lang = null) {
		let l = fromAny(lang);
		if (l === null)
			return null;

		if (Math.abs(this.days) >= 1)
			return this.toStrByDays(l);

		l = l.intWords;

		let secs = this.seconds;
		let pre = l.afterGram;
		if (secs < 0) {
			pre = l.beforeGram;
			secs *= -1;
		}

		if (secs < 60)
			return intInfo(pre, secs, l.second);
		if (secs < 60 * 60)
			return intInfo(pre, secs / 60, l.minute);

		// because days > 1 get filtered out before
		// this must be in hours
		return intInfo(pre, secs / (60 * 60), l.hour);
	}

}

// int = intelligent
function intInfo(gram, num, [oneUnit, one, many]) {
	num = Math.round(num);
	if (num <= 1) {
		num = oneUnit;
		many = one;
	}
	return gram(num, many);
}