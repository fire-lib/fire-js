/// synchronisation point
export default class Barrier {
	constructor() {
		this.listeners = [];
		this.lastValue = null;
		this.open = false;
	}

	/**
	 * Add yourself to the barrier
	 * 
	 * Only if all participants call ready the barrier is opened.
	 */
	add() {
		if (this.open)
			throw new Error('Barrier open');

		const id = this.listeners.length;

		const obj = {
			ready: false,
			resolve: null
		};

		const readyPromise = new Promise(resolve => {
			obj.resolve = resolve;
		});

		this.listeners[id] = obj;

		return {
			ready: async val => {
				if (this.open)
					throw new Error('Barrier open');

				this.lastValue = val;
				obj.ready = true;

				this._maybeTrigger();

				return await readyPromise;
			},
			remove: () => {
				if (this.open)
					throw new Error('Barrier open');

				// remove myself from the barrier
				this.listeners[id] = null;

				this._maybeTrigger();
			}
		}
	}

	_maybeTrigger() {
		const ready = this.listeners.every(v => v === null || v.ready);
		// if all are ready
		if (!ready)
			return;

		// send the last value to all of them
		this.listeners.forEach(v => v.resolve(this.lastValue));
		this.listeners = [];
		this.open = true;
	}
}