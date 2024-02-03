import { padZero } from '../utils/utils.js';

export default class DateTimeRange {
	/// expects
	/// from: DateTime
	/// to: DateTime
	constructor(from, to) {
		this.from = from;
		this.to = to;
	}

	// returns
	// 10.10.2020 - 10.12.2023
	// 10.10 - 10.12.2020
	// 11 - 10.10.2020
	// 10.10.2020
	toStrDate() {
		const f = this.from;
		const t = this.to;

		if (f.year !== t.year) {
			return f.toStrDate() + ' - ' + t.toStrDate();
		}

		if (f.month !== t.month) {
			return f.toStrShortDate() + ' - ' + t.toStrDate();
		}

		if (f.date !== t.date) {
			return padZero(f.date) + ' - ' + t.toStrDate();
		}

		return t.toStrDate();
	}

	// returns 10:30 - 14:40
	// returns 10:30
	toStrShortTime() {
		const f = this.from.toStrShortTime();
		const t = this.to.toStrShortTime();

		if (f !== t) return f + ' - ' + t;
		return f;
	}

	// returns 03.07.2023 18:00 - 04.07.2024 18:00
	// returns 04.08 18:00 - 03.07.2023 18:00
	// returns 04.07 18:00 - 05.07.2023 18:00
	// returns 18:00 - 19:35 05.07.2023
	toStrDateShortTime() {
		const f = this.from;
		const t = this.to;

		if (f.year !== t.year) {
			const from = f.toStrDate() + ' ' + f.toStrShortTime();
			const to = t.toStrDate() + ' ' + t.toStrShortTime();
			return from + ' - ' + to;
		}

		if (f.month !== t.month || f.date !== t.date) {
			const from = f.toStrShortDate() + ' ' + f.toStrShortTime();
			const to = t.toStrDate() + ' ' + t.toStrShortTime();
			return from + ' - ' + to;
		}

		// date the same
		if (f.hours !== t.hours || f.minutes !== t.minutes) {
			const from = f.toStrDate() + ' ' + f.toStrShortTime();
			const to = t.toStrShortTime();
			return from + ' - ' + to;
		}

		return f.toStrDate() + ' ' + f.toStrShortTime();
	}
}
