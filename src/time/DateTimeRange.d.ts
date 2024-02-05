import DateTime from './DateTime';

export default class DateTimeRange {
	/**
	 * Create a new DateTimeRange instance
	 * @constructor
	 * @param {DateTime} start - The start date value
	 * @param {DateTime} end - The end date value
	 */
	constructor(start: DateTime, end: DateTime);

	/**
	 * returns
	 * 10.10.2020 - 10.12.2023
	 * 10.10 - 10.12.2020
	 * 11 - 10.10.2020
	 * 10.10.2020
	 */
	toStrDate(): string;

	/**
	 * returns
	 * 10:30 - 14:40
	 * 10:30
	 */
	toStrShortTime(): string;

	/**
	 * returns
	 * 03.07.2023 18:00 - 04.07.2024 18:00
	 * 04.08 18:00 - 03.07.2023 18:00
	 * 04.07 18:00 - 05.07.2023 18:00
	 * 18:00 - 19:35 05.07.2023
	 */
	toStrDateShortTime(): string;
}