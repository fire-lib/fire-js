
/// Managers event listeners or just function
export default class Listeners {
	constructor() {
		this.inner = new Set;
	}

	/// returns a function you need to call to unsubscribe
	add(fn) {
		// get a reference to the set
		// we don't clear out the wrong listener
		const set = this.inner;
		set.add(fn);
		return () => {
			set.delete(fn);
		};
	}

	/// Might throw if an event listeners throws
	trigger(val = null) {
		this.inner.forEach(fn => fn(val));
	}

	// clears
	clearAndTrigger(val = null) {
		const s = this.inner;
		this.clear();
		s.forEach(fn => fn(val));
	}

	clear() {
		this.inner = new Set;
	}
}