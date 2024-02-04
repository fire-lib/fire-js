export declare type BarrierAction<T> = {
	ready: (val: T) => Promise<T>;
	remove: () => void;
};

export default class Barrier<T> {
	constructor();

	/**
	 * Add yourself to the barrier
	 *
	 * Only if all participants call ready the barrier is opened.
	 */
	add(): BarrierAction<T>;
}
