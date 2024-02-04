/**
 * Manages event listeners or functions.
 */
export default class Listeners<T extends any[]> {
	/**
	 * Creates a new instance of Listeners.
	 */
	constructor();

	/**
	 * Adds a new listener to the set.
	 *
	 * @param fn The function to be added as a listener. It should accept the same arguments as those passed to trigger.
	 * @returns A function that, when called, will remove the added listener from the set.
	 */
	add(fn: (...args: T) => void): () => void;

	/**
	 * Calls each listener in the set with the given arguments.
	 *
	 * @param args The arguments to be passed to each listener.
	 * @throws Will throw an error if a listener throws an error.
	 */
	trigger(...args: T): void;

	/**
	 * Clears all listeners from the set, then calls each previously stored listener with the given arguments.
	 *
	 * @param args The arguments to be passed to each listener.
	 * @throws Will throw an error if a listener throws an error.
	 */
	clearAndTrigger(...args: T): void;

	/**
	 * Removes all listeners from the set.
	 */
	clear(): void;
}
