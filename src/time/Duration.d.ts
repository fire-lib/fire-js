import DateTime from './DateTime';

export default class Duration {
	/**
	 * Create a new Duration instance
	 *
	 * @param {number} duration - The duration in milliseconds
	 */
	constructor(duration: number);

	/**
	 * Calculate the duration between two dates
	 *
	 * @param {DateTime} from - The start date
	 * @param {DateTime} to - The end date
	 */
	static from(from: DateTime, to: DateTime): Duration;

	/**
	 * Calculate the duration from now to a date
	 *
	 * @param {DateTime} to - The end date
	 */
	static toNow(to: DateTime): Duration;

	get seconds(): number;

	get minutes(): number;

	get hours(): number;

	get days(): number;

	get weeks(): number;

	toStrByDays(lang?: string | null): string;

	toStr(lang?: string | null): string;
}
