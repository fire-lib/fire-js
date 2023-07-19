/**
 * Manages event listeners or functions.
 * @class
 * @exports util/listeners/Listeners
 */
export default class Listeners {
	/**
	 * Creates a new instance of Listeners.
	 * @constructor Listeners
	 */
	constructor() {
		this.inner = new Set();
	}

	/**
	 * Adds a new listener to the set.
	 *
	 * @param {Function} fn - The function to be added as a listener.
	 * @returns {Function} A function that, when called, will remove the added
	 * listener from the set.
	 */
	add(fn) {
		const set = this.inner;
		set.add(fn);
		return () => {
			set.delete(fn);
		};
	}

	/**
	 * Calls each listener in the set with the given value.
	 *
	 * @param {*} [val=null] - The value to be passed to each listener.
	 * @throws Will throw an error if a listener throws an error.
	 */
	trigger(val = null) {
		this.inner.forEach(fn => fn(val));
	}

	/**
	 * Clears all listeners from the set, then calls each previously stored
	 * listener with the given value.
	 *
	 * @param {*} [val=null] - The value to be passed to each listener.
	 * @throws Will throw an error if a listener throws an error.
	 */
	clearAndTrigger(val = null) {
		const s = this.inner;
		this.clear();
		s.forEach(fn => fn(val));
	}

	/**
	 * Removes all listeners from the set.
	 */
	clear() {
		this.inner = new Set();
	}
}
