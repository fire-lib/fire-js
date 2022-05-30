
export default class SlotArray {
	constructor() {
		this.inner = [];
		this.free = [];
	}

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

	/// returns all items from the array
	/// except values that are null
	all() {
		return this.inner.filter(f => f !== null);
	}

	/// returns all items from the array
	/// except values that are null
	/// Type: [[id, value]]
	entries() {
		return this.inner.map((v, i) => [i, v])
			.filter(([i, v]) => v !== null);
	}

	get(id) {
		return this.inner[id];
	}

	remove(id) {
		this.inner[id] = null;
		this.free.push(id);
	}
}