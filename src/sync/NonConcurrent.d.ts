export type NonConcurrentReady = {
	ready: () => void;
};

export default class NonConcurrent {
	/**
	 * Creates a new NonConcurrent
	 */
	constructor();

	/**
	 * Waits until any other non-concurrent requests is done then waits until you call ready
	 *
	 * returns an object where you need to call ready once done
	 */
	start(): Promise<NonConcurrentReady>;
}
