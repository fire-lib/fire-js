
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

		const onOpen = () => {
			this.connected = true;
			this.openListeners.trigger();
		};
		const onMessage = e => {
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
		};
		const onError = e => {
			this.errorListeners.trigger(e);

			// As noted in the comment of the class we treat this event as
			// a close event if the connection was opened.
			if (!this.connected) {
				// trigger the close event
				this._close();
				return;
			}
		};
		let onClose = () => {};
		onClose = e => {
			// As noted in the comment of the class we ignore this event
			// if we're not connected
			if (!this.connected)
				return;

			// reset the entire state
			this.connected = false;
			this.ws.removeEventListener('open', onClose);
			this.ws.removeEventListener('message', onMessage);
			this.ws.removeEventListener('error', onError);
			this.ws.removeEventListener('error', onClose);
			this.ws = null;

			// we need to clear the maps since we wan't to be able to accept
			// new Senders while in the close trigger.
			this.senders = new Map;
			this.receivers = new Map;
			this.closeListeners.trigger();
		};

		this.ws.addEventListener('open', onOpen);
		this.ws.addEventListener('message', onMessage);
		this.ws.addEventListener('error', onError);
		this.ws.addEventListener('close', onClose);
	}

	onError(fn) {
		return this.errorListeners.add(fn);
	}

	onClose(fn) {
		return this.closeListeners.add(fn);
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

	/// Creates a new Sender
	/// 
	/// ## Throws
	/// If the action already exists.
	newSender(action) {
		if (this.senders.has(action))
			throw new ApiError('Other', 'sender already exists');

		const sender = new Sender(action, this);
		this.senders.set(action, sender);

		return sender;
	}

	/// returns a Sender
	/// 
	/// When the promise get's resolved this means the sender is ready to send
	/// data.
	/// 
	/// ## Throws
	/// throws if could not transmit the request or the action already exists.
	async newSender(action, request = null) {
		if (this.senders.has(action))
			throw new ApiError('Other', 'sender already exists');

		// we need to insert the sender since else we could send duplicated
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
			});
		} catch (e) {
			this.senders.delete(action);
			throw e;
		}

		await sender._waitReady();

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
			case 'SenderClose':
				sender = this.senders.get(msg.action);
				if (!sender)
					return console.log('sender not found', msg.action);

				sender._onMsg(msg);
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

		this.opened = false;
		this.openProm = null;// {resolve, error}

		this.errorListeners = new Listeners;
	}

	isReady() {
		return !this.openProm && this.opened;
	}

	/// Try to open a sender
	/// 
	/// ## Throws
	/// If the sender is already open or if requesting a sender failed
	async open(req) {
		if (this.openProm || this.opened)
			throw new ApiError('Other', 'Sender already opened');

		const prom = new Promise((resolve, error) => {
			this.openProm = { resolve, error };
		});

		try {
			await this.stream._waitReady();

			this.stream._send({
				kind: 'SenderRequest',
				action: this.action,
				data: req
			});

			await prom;
		} catch (e) {
			this.openProm = null;
			throw e;
		}

		this.opened = true;
		this.openProm = null;
	}

	// we receive a message from the stream
	_onMsg(msg) {
		switch (msg.kind) {
			// the request was acknowledged
			case 'SenderRequest':
				if (!this.openProm) {
					console.log('could not open Prom');
					break;
				}

				// send open finished
				this.openProm.resolve();

				break;
			// the request was closed
			case 'SenderClose':

				let error = new ApiError('Other', 'Sender closed unexpected');

				// let's try to convert the msg into an ApiError
				if (msg.data) {
					try {
						error = ApiError.fromJson(msg.data);
					} catch (e) {
						console.log('close message not an Error', e);
					}
				}

				this._closeWithError(error);
				break;
		}
	}

	_closeWithError(err) {
		// there was an error while trying to register
		if (this.openProm) {
			this.openProm.error(error);
			break;
		}

		this.errorListeners.trigger(error);
		this.opened = false;
	}

	/// ## Throws
	// if could not send the message
	// or if the channel is already closed
	send(msg) {
		if (!this.isReady())
			throw new ApiError('SenderClosed', 'Sender already closed');

		this.stream._send({
			kind: 'SenderMessage',
			action: this.action,
			data: msg
		});
	}

	/// When you receive this event you know the channel closed.
	/// You can call open again to try to reconnect.
	/// 
	/// Returns a fn to unsubscribe
	onError(fn) {
		return this.errorListeners.add(fn);
	}

	/// Does nothing if the Sender is not ready
	/// 
	/// This might trigger the error event if sending the senderClosed failed
	/// and the connection get's closed right after that.
	close() {
		if (!this.isReady())
			return;

		this.opened = false;

		try {
			this.stream._send({
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