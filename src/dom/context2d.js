
const TWO_PI = 2 * Math.PI;

export default class Context2d {

	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.dpi = Math.ceil(window.devicePixelRatio);
	}

	get width() {
		return this.canvas.clientWidth;
	}

	set width(width) {
		this.canvas.width = width * this.dpi;
		this.canvas.style.width = width + 'px';
	}

	get height() {
		return this.canvas.clientHeight;
	}

	set height(height) {
		this.canvas.height = height * this.dpi;
		this.canvas.style.height = height + 'px';
	}

	updateSize(width = null, height = null) {
		this.width = width === null ? this.width : width;
		this.height = height === null ? this.height : height;
		this.ctx.scale(this.dpi, this.dpi);
	}

	get font() {
		return this.ctx.font;
	}

	set font(f) {
		this.ctx.font = f;
	}

	get fillStyle() {
		return this.ctx.fillStyle;
	}

	set fillStyle(style) {
		this.ctx.fillStyle = style;
	}

	get strokeStyle() {
		return this.ctx.strokeStyle;
	}

	set strokeStyle(style) {
		this.ctx.strokeStyle = style;
	}

	get lineWidth() {
		return this.ctx.lineWidth;
	}

	set lineWidth(w) {
		this.ctx.lineWidth = w;
	}

	clearRect(x, y, width, height) {
		this.ctx.clearRect(x, y, width, height);
	}

	clearAll() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	rect(x, y, width, height) {
		this.ctx.rect(x, y, width, height);
	}

	circle(x, y, radius) {
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, TWO_PI);
	}

	// todo maybe we should create a new struct
	// which will have a moveTo lineTo Arc Close
	beginPath() {
		this.ctx.beginPath();
	}

	closePath() {
		this.ctx.closePath();
	}

	moveTo(x, y) {
		this.ctx.moveTo(x, y);
	}

	lineTo(x, y) {
		this.ctx.lineTo(x, y);
	}

	// arc(x, y, radius, startAngle, endAngle) {
	// 	this.ctx.arc(x, y, radius, startAngle, endAngle);
	// }

	fill() {
		this.ctx.fill();
	}

	stroke() {
		this.ctx.stroke();
	}

	fillRect(x, y, width, height) {
		this.ctx.fillRect(x, y, width, height);
	}

	strokeRect(x, y, width, height) {
		this.ctx.strokeRect(x, y, width, height);
	}

	fillCircle(x, y, radius) {
		this.circle(x, y, radius);
		this.fill();
	}

	strokeCircle(x, y, radius) {
		this.circle(x, y, radius);
		this.stroke();
	}

	strokeLine(sX, sY, eX, eY) {
		this.ctx.beginPath();
		this.ctx.moveTo(sX, sY);
		this.ctx.lineTo(eX, eY);
		this.ctx.stroke();
		this.ctx.closePath();
	}

	fillText(text, x, y) {
		this.ctx.fillText(text, x, y);
	}

	strokeText(text, x, y) {
		this.ctx.strokeText(text, x, y);
	}

	// See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
	drawImage(...args) {
		this.ctx.drawImage(...args);
	}

}