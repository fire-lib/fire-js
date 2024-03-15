export type NonConcurrentReady = {
	ready: () => void;
};

/// synchronisation point
/**
 * A class to help make async code non concurrent.
 *
 * Example:
 * ```ts
 * const nonConcurrent = new NonConcurrent();
 *
 * async function foo() {
 * 	const ready = await nonConcurrent.start();
 * 	console.log('point 1');
 * 	// do something
 * 	await timeout(100);
 * 	console.log('point 2');
 * 	ready.ready();
 * }
 *
 * async function bar() {
 * 	const ready = await nonConcurrent.start();
 * 	console.log('point 3');
 * 	// do something
 * 	ready.ready();
 * }
 *
 * await Promise.all([foo(), bar()]);
 * ```
 */
export default class NonConcurrent {
	private listeners: Array<(v?: null) => void>;
	private running: boolean;

	/**
	 * Creates a new NonConcurrent
	 */
	constructor() {
		this.listeners = [];
		this.running = false;
	}

	/**
	 * Waits until any other non-concurrent requests is done then waits until you call ready
	 *
	 * returns an object where you need to call ready once done
	 */
	async start(): Promise<NonConcurrentReady> {
		if (this.running) {
			await new Promise(resolve => {
				this.listeners.push(resolve);
			});
		}

		this.running = true;

		return {
			ready: () => {
				this.running = false;
				const resolve = this.listeners.shift();
				if (resolve) resolve();
			},
		};
	}
}
