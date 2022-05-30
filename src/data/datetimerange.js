
import { padZero } from './../util.js';

export default class DateTimeRange {
	constructor(from, to) {
		this.from = from;
		this.to = to;
	}

	// returns 10.10.2020 - 10.10.2020
	toStrDate() {
		const f = this.from;
		const t = this.to;

		if (f.year !== t.year)
			return f.toStrDate() + ' - ' + t.toStrDate();

		if (f.month !== t.month)
			return f.toStrShortDate() + ' - ' + t.toStrDate();

		if (f.date !== t.date)
			return padZero(f.date) + ' - ' + t.toStrDate();

		return t.toStrDate();
	}
}