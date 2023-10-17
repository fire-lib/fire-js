/// synchronisation point
export default class NonConcurrent {
	constructor() {
		this.listeners = [];
		this.running = false;
	}

	// returns an object where you need to call ready once done
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
				if (resolve)
					resolve();
			}
		};
	}
}