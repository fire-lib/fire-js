/**
 * Implements a slot array data structure.
 * @class
 * @exports util/slotarray/SlotArray
 */
export default class SlotArray {
	/**
	 * Creates a new instance of SlotArray.
	 * @constructor
	 */
	constructor() {
		this.inner = [];
		this.free = [];
	}

	/**
	 * Inserts a value into the array. If there are free slots, the value is
	 * inserted into one of them.
	 * Otherwise, it's appended to the end of the array.
	 *
	 * @param {*} val - The value to be inserted.
	 * @returns {number} The index at which the value was inserted.
	 */
	push(val) {
		let id = this.free.pop();
		if (typeof id === 'number') {
			this.inner[id] = val;
		} else {
			id = this.inner.length;
			this.inner.push(val);
		}

		return id;
	}

	/**
	 * Returns all non-null items in the array.
	 *
	 * @returns {*[]} An array of all non-null items in the array.
	 */
	all() {
		return this.inner.filter(f => f !== null);
	}

	/**
	 * Returns all non-null items in the array, along with their indices.
	 *
	 * @returns {[number, *][]} An array of tuples, where each tuple consists
	 * of an index and the corresponding non-null item.
	 */
	entries() {
		// @ts-ignore
		return this.inner.map((v, i) => [i, v])
			.filter(([_, v]) => v !== null);
	}

	/**
	 * Retrieves the item at the given index.
	 *
	 * @param {number} id - The index to retrieve the item from.
	 * @returns {*} The item at the given index, or null if no item is present.
	 */
	get(id) {
		return this.inner[id];
	}

	/**
	 * Removes the item at the given index, making its slot available for future
	 * insertions.
	 *
	 * @param {number} id - The index to remove the item from.
	 */
	remove(id) {
		this.inner[id] = null;
		this.free.push(id);
	}
}