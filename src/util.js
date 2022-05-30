
export function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function sortToLower(a, b) {
	if (a > b)
		return -1;
	else if (b > a)
		return 1;
	return 0;
}

export function sortToHigher(a, b) {
	if (a > b)
		return 1;
	else if (b > a)
		return -1;
	return 0;
}

// > 0 b .. a
// < 0 a .. b

export function time() {
	return (new Date).getTime();
}

export function padZero(val, length = 2) {
	// make val a string
	val += '';
	if (val.length >= length)
		return val;
	let prev = '';
	for (let i = val.length; i < length; i++)
		prev += '0';
	return prev + val;
}

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const ALPHABET_LENGTH = ALPHABET.length;

export function randomToken(length = 8) {
	let s = '';
	for (let i = 0; i < length; i++)
		s += ALPHABET[Math.floor(Math.random() * ALPHABET_LENGTH)];
	return s;
}

// creates an array with start..end where end is not inclusive
// start and end need to be whole numbers
// todo: improve this function
export function range(start, end, step = 1) {
	const len = end - start / step;
	const ar = new Array(len);
	let c = 0;
	for (let i = start; i < end; i += step) {
		ar[c] = i;
		c += 1;
	}
	return ar;
}

// returns null if the array is empty
export function randomEl(arr) {
	if (arr.length === 0)
		return null;

	const i = Math.floor(Math.random() * arr.length);
	return arr[i];
}

// returns 0 if no match
// returns 1+ if there was a match (lower is better)
export function match(search, val) {
	if (search.length === 0)
		return 0;

	search = search.toLowerCase();
	val = val.toLowerCase();

	const i = val.indexOf(search);
	// search not found in val
	if (i === -1)
		return 0;

	const distLeft = searchSpaceLeft(i, val);
	const distRight = searchSpaceLeft(i + search.length, val);

	return 1 + distLeft + distRight;
}

// calculate distance to space left of
function searchSpaceLeft(idx, val) {
	let dist = 0;
	while (idx > 0) {
		idx--;
		if (val[idx] === ' ')
			return dist;
		dist++;
	}
	return dist;
}

// calculate distance to space right of
function searchSpaceRight(idx, val) {
	let dist = 0;
	while (idx < val.length - 1) {
		idx++;
		if (val[idx] === ' ')
			return dist;
		dist++;
	}
	return dist;
}

export function sum(ar) {
	return ar.reduce((a, b) => a + b, 0);
}