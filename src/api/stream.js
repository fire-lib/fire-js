
import ApiError from './error.js';
import Data from './../data/data.js';
import { timeout } from './../util.js';
import Listeners from './../util/listeners.js';

/// The Stream is responsible for managing your connection with a server
/// when you call connect Stream will try to create a WebSocket connection.
/// 
/// At this point you can start a Sender or Receiver. The request will wait
/// until a channel could be established or the server closed it.
/// 
/// You can listen for messages or send them until you receive the error event
/// which will mean the channel was closed. You can then try to create a new
/// one.
/// 
/// When the Stream triggers an error event this might mean the connection is
/// closed but doesn't have to. You should wait until you receive the close
/// event to be sure. After that you can call connect again.
/// 
/// 
/// ## Important
/// Only use functions all properties are private also functions prefix with an
/// underscore.
/// 
// ## Internal
// We expect that the WebSocket class only triggers a close event if the connect
// was established. This is the case in some circumstances but not in all.
// So we just relly on error if the connection was not opened and on close
// if the connection was opened.
export default class Stream {
	/*
	pub props:
	- connected: (readyonly)
	- connecting: (readyonly)
	- path
	*/

	// api: Api instance
	constructor(api, path) {
		this.api = api;
		this.path = path;

		this.ws = null;
		this.connected = false;

		// event listeners these names refer to the events we wan't to trigger
		this.openListeners = new Listeners;
		this.errorListeners = new Listeners;
		this.closeListeners = new Listeners;

		// on received a close event the senders and receivers are already
		// cleaned

		// <Action, Sender>
		this.senders = new Map;
		// <Action, Receiver>
		this.receivers = new Map;
	}

	/// Only returns true if the connection state is Open.
	isConnect() {
		return this.connected;
	}

	_addr() {
		if (!this.api.addr)
			throw new ApiError('Other', 'Server addr not defined');
		const url = new URL(this.api.addr);
		const encrypted = url.protocol === 'https:';
		url.protocol = encrypted ? 'wss:' : 'ws:';
		let strUrl = url.toString();
		if (strUrl.endsWith('/'))
			strUrl = strUrl.substr(0, strUrl.length - 1);
		return strUrl + this.path;
	}

	/// Starts to connect if there is no connection.
	///
	/// ## Throws
	/// Or if there was an issue with the address.
	connect() {
		if (this.ws)
			throw new ApiError('Other', 'Connection already started');

		const addr = this._addr();

		this.ws = new WebSocket(addr);

		this.ws.addEventListener('open', this._onOpen);
		this.ws.addEventListener('message', this._onMessage);
		this.ws.addEventListener('error', this._onError);
		this.ws.addEventListener('close', this._onClose);
	}

	_onOpen() {
		this.connected = true;
		this.openListeners.trigger();
	}

	_onMessage(e) {
		if (typeof e.data !== 'string')
			return console.log('unrecognized websocket message', e);

		let protMsg;
		try {
			protMsg = new ProtMessage(JSON.parse(e.data));
		} catch (e) {
			console.log('failed to deserialize', e);
			return;
		}

		// not in try since that is a user error which
		// should propagate
		this._handleProtMessage(protMsg);
	}

	_onError(e) {
		this.errorListeners.trigger(e);

		// As noted in the comment of the class we treat this event as
		// a close event if the connection was opened.
		if (!this.connected) {
			// trigger the close event
			this._close();
			return;
		}
	}

	_onClose(e) {
		// As noted in the comment of the class we ignore this event
		// if we're not connected
		if (!this.connected)
			return;

		this._close();
	}

	_close() {
		// reset the entire state
		this.connected = false;
		this.ws.removeEventListener('open', this._onClose);
		this.ws.removeEventListener('message', this._onMessage);
		this.ws.removeEventListener('error', this._onError);
		this.ws.removeEventListener('error', this._onClose);
		this.ws = null;

		// we need to clear the maps since we wan't to be able to accept
		// new Senders while in the close trigger.
		this.senders = new Map;
		this.receivers = new Map;
		this.closeListeners.trigger();
	}

	/// Closes a connection if there is one
	close() {
		if (!this.ws)
			return;

		this.ws.close();
	}

	/// this promise waits until a connection is established
	/// so there might be close events in between
	async _waitReady() {
		return await new Promise((resolve, error) => {
			if (this.connected)
				return;

			let rmFn = () => {};
			rmFn = this.openListeners.add(() => {
				rmFn();
				resolve();
			});
		});
	}

	/// returns a Sender
	/// 
	/// ## Throws
	/// throws if could not transmit the request or the action already exists.
	async newSender(action, request = null) {
		if (this.senders.has(action))
			throw new ApiError('Other', 'sender already exists');

		// we need to insert the sender since else we could send dublicated
		// action requests
		// we just need to make sure that we don't throw.

		const sender = new Sender(action, this);
		this.senders.set(action, sender);

		try {
			// wait until ready
			await this._waitReady();

			// send message
			this._send({
				kind: 'SenderRequest',
				action,
				data: request
			})
		} catch (e) {
			this.senders.delete(action);
			throw e;
		}

		await sender.privReady();

		return sender;
	}

	/// returns a Receiver
	/// throws if could not transmit the request
	/// or if a receiver is already registered
	async newReceiver(action, request = null) {
		if (this.receivers.has(action))
			throw new ApiError('Other', 'receiver already exists');

		const receiver = new Receiver(action, this);
		this.privSend({
			kind: 'ReceiverRequest',
			action,
			data: request
		});

		this.receivers.set(action, receiver);

		await receiver.privReady();

		return receiver;
	}

	// priv
	_send(protMsg) {
		if (this.ws.readyState !== 1)
			throw new ApiError('Closed', 'connection not ready');

		this.ws.send(JSON.stringify(protMsg));
	}

	// priv
	_handleProtMessage(msg) {
		// define it here since switch does not have variable scopes
		// how anoying!!!
		let receiver, sender;

		switch (msg.kind) {
			case 'SenderRequest':
				sender = this.senders.get(msg.action);
				if (!sender)
					return console.log('sender not found', msg.action);

				// this a confirmation that the request was successfully received
				sender.privSetReady();
				return;

			case 'SenderClose':
				sender = this.senders.get(msg.action);
				if (!sender)
					return console.log('sender not found', msg.action);
				this.senders.delete(msg.action);

				sender.privClose(msg.data);
				return;

			case 'ReceiverRequest':
				receiver = this.receivers.get(msg.action);
				if (!receiver)
					return console.log('receiver not found', msg.action);

				// this a confirmation that the request was successfully received
				receiver.privSetReady();
				return;

			case 'ReceiverMessage':
				receiver = this.receivers.get(msg.action);
				if (!receiver)
					return console.log('receiver not found', msg.action);

				receiver.handleMessage(msg.data);
				return;

			case 'ReceiverClose':
				receiver = this.receivers.get(msg.action);
				if (!receiver)
					return console.log('receiver not found', msg.action);
				this.receivers.delete(msg.action);

				receiver.privClose(msg.data);
				return;

			case 'SenderMessage':
			default:
				console.log('received unexpected message', msg);
				return;
		}
	}
}

// protocolMessage
export class ProtMessage extends Data {
	constructor(data) {
		super({
			kind: 'str',
			action: 'str',
			data: 'any'
		}, data);
	}
}

export class Sender {
	constructor(action, stream) {
		this.action = action;
		this.stream = stream;

		this.closeListeners = new Set;
		this.closed = false;

		this.readyProm = null;
	}

	// throws if could not send the message
	// or if the channel is already closed
	send(msg) {
		if (this.closed)
			throw new ApiError('SenderClosed', 'sender already closed');

		this.stream.privSend({
			kind: 'SenderMessage',
			action: this.action,
			data: msg
		});
	}

	//fn (error = null)
	onClose(fn) {
		this.closeListeners.add(fn);

		return () => {
			this.closeListeners.delete(fn);
		};
	}

	/// does not notify fns registered with onClose
	close() {
		if (this.closed)
			return;
		this.closed = true;

		try {
			this.stream.privSend({
				kind: 'SenderClose',
				action: this.action,
				data: null
			});
		} catch (e) {
			console.log('could not send SenderClose', e);
		}

		this.stream.senders.delete(this.action);
	}

	// priv
	privClose(msg = null) {
		// let's try to convert the msg into an ApiError
		if (msg) {
			try {
				msg = ApiError.fromJson(msg);
			} catch (e) {
				console.log('close message not an Error', e);
			}
		}

		// if we haven't received a confirmation message
		// this means the Sender is not valid
		if (this.readyProm) {
			this.readyProm.error(msg);
			this.readyProm = null;
		}

		this.closeListeners.forEach(tryFn(fn => fn(msg)));
		this.closed = true;
	}

	privReady() {
		return new Promise((resolve, error) => {
			this.readyProm = { resolve, error };
		});
	}

	privSetReady() {
		if (!this.readyProm)
			return console.log('unexpected SenderRequest');

		this.readyProm.resolve();
		this.readyProm = null;
	}
}

export class Receiver {
	constructor(action, stream) {
		this.action = action;
		this.stream = stream;

		this.closeListeners = new Set;
		this.messageListeners = new Set;
		this.closed = false;

		this.parseFn = d => d;

		this.readyProm = null;
	}

	// fn (msg)
	onMessage(fn) {
		this.messageListeners.add(fn);

		return () => {
			this.messageListeners.delete(fn);
		};
	}

	// fn(data) -> data
	setParseFn(fn) {
		this.parseFn = fn;
	}

	//fn (error = null)
	onClose(fn) {
		this.closeListeners.add(fn);

		return () => {
			this.closeListeners.delete(fn);
		};
	}

	/// does not notify fns registered with onClose
	close() {
		if (this.closed)
			return;
		this.closed = true;

		try {
			this.stream.privSend({
				kind: 'ReceiverClose',
				action: this.action,
				data: null
			});
		} catch (e) {
			console.log('could not send ReceiverClose', e);
		}

		this.stream.receivers.delete(this.action);
	}

	// priv
	handleMessage(msg) {
		this.messageListeners.forEach(tryFn(fn => fn(this.parseFn(msg))));
	}

	// priv
	privClose(msg = null) {
		// let's try to convert the msg into an ApiError
		if (msg) {
			try {
				msg = ApiError.fromJson(msg);
			} catch (e) {
				console.log('close message not an Error', e);
			}
		}

		// if we haven't received a confirmation message
		// this means the Sender is not valid
		if (this.readyProm) {
			this.readyProm.error(msg);
			this.readyProm = null;
		}

		this.closeListeners.forEach(tryFn(fn => fn(msg)));
		this.closed = true;
	}

	privReady() {
		return new Promise((resolve, error) => {
			this.readyProm = { resolve, error };
		});
	}

	privSetReady() {
		if (!this.readyProm)
			return console.log('unexpected SenderRequest');

		this.readyProm.resolve();
		this.readyProm = null;
	}
}

export class PersistentReceiver {
	constructor(action, stream, req) {
		this.action = action;
		this.stream = stream;

		// == null if the connection is not started
		this.inner = null;
		this.shouldConnect = false;
		this.reqToSend = req;

		this.parseFn = d => d;

		this.listeners = new Set;

		this.connecting = false;

		this.onConnectedRm = this.stream.onConnected(() => {
			this.open();
		});
		// we don't need to listen on streamClose since
		// if it closes and we have an open channel the close triggers in
		// Receiver::onClose and else if stream reconnects onConnected get's
		// triggered
	}

	// fn (data)
	onMessage(fn) {
		this.shouldConnect = true;
		this.open();

		this.listeners.add(fn);

		return () => {
			this.listeners.delete(fn);
			// todo check if there are no listeners left
			// then close the receiver
			if (this.listeners.size === 0) {
				this.shouldConnect = false;
				if (this.inner) {
					this.inner.close();
					this.inner = null;
				}
			}
		};
	}

	// fn(data) -> data
	setParseFn(fn) {
		this.parseFn = fn;
		if (this.inner)
			this.inner.setParseFn(fn);
	}

	// priv
	async open() {
		if (!this.stream.connected ||
			this.inner ||
			this.connecting ||
			!this.shouldConnect
		)
			return;

		this.connecting = true;

		try {
			this.inner = await this.stream.newReceiver(
				this.action,
				this.reqToSend
			);
			this.inner.setParseFn(this.parseFn);

			this.inner.onMessage(d => {
				this.listeners.forEach(fn => fn(d));
			});
			this.inner.onClose(async e => {
				this.inner = null;
				await timeout(500);
				this.open();
			});
			this.connecting = false;
		} catch (e) {
			this.connecting = false;
			console.log('creating receiver failed', e);

			await timeout(500);
			this.open();
			return;
		}
	}
}

/// returns a function which calls fn
function tryFn(fn) {
	return (...args) => {
		try {
			return fn(...args);
		} catch (e) {
			console.log('function failed', e);
		}
	};
}