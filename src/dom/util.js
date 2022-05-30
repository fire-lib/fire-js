// create element
export function c(el, attrs = {}) {
	el = document.createElement(el);
	Object.entries(attrs).forEach(([key, val]) => {
		switch (key) {
			case 'cls':
				el.className = val;
				break;

			case 'data':
				Object.entries(val).forEach(([key, val]) => {
					el.dataset[key] = val;
				});
				break;

			case 'text':
				el.innerText = val;
				break;

			default:
				el[key] = val;
				break;
		}
	});
	return el;
}

export class CustomEl {
	__customEl__() {}
}

// append child
export function a(to, ...els) {
	els.forEach(el => {
		if (!el)
			return;

		if (typeof el.__customEl__ === 'function')
			to.appendChild(el.raw);
		else
			to.appendChild(el);
	});
	
	return to;
}

// on
export function o(to, ev, fn) {
	to.addEventListener(ev, fn);
}

// class toggle
// if cond === null the class toggle normaly
// if (cond) the class is added
// if (!cond) the class is removed
export function ct(to, className, cond = null) {
	if (cond === null)
		to.classList.toggle(className);
	else if (cond)
		to.classList.add(className);
	else
		to.classList.remove(className);
}

// returns { x, y }
export function offset(el) {
	const { left, top } = el.getBoundingClientRect();
	return { x: left, y: top };
}