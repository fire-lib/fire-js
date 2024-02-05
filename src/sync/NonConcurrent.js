/// synchronisation point
export default class NonConcurrent {
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
	async start() {
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
