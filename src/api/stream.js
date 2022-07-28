
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
		let onClose = () => {};
		const close = () => {
			// reset the entire state
			this.connected = false;
			this.ws.removeEventListener('open', onOpen);
			this.ws.removeEventListener('message', onMessage);
			this.ws.removeEventListener('error', onError);
			this.ws.removeEventListener('error', onClose);
			this.ws = null;

			this.closeListeners.trigger();
		};
		const onError = e => {
			this.errorListeners.trigger(e);

			// As noted in the comment of the class we treat this event as
			// a close event if the connection was opened.
			if (!this.connected) {
				// trigger the close event
				close();
				return;
			}
		};
		onClose = e => {
			// As noted in the comment of the class we ignore this event
			// if we're not connected
			if (!this.connected)
				return;

			close();
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
				return resolve();

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

	/// Creates a new Receiver
	/// 
	/// ## Throws
	/// If the action already exists.
	newReceiver(action) {
		if (this.receivers.has(action))
			throw new ApiError('Other', 'receiver already exists');

		const receiver = new Receiver(action, this);
		this.receivers.set(action, receiver);

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
			case 'ReceiverMessage':
			case 'ReceiverClose':
				receiver = this.receivers.get(msg.action);
				if (!receiver)
					return console.log('receiver not found', msg.action);

				receiver._onMsg(msg);
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

const STATE_CLOSED_FOREVER = 0;
const STATE_READY_TO_OPEN = 1;
const STATE_WAITING_ON_CONNECTION = 2;
const STATE_OPENING = 3;
const STATE_OPENED = 4;

export class Sender {
	constructor(action, stream) {
		this.action = action;
		this.stream = stream;

		/// 0: Closed forever
		/// 	means this sender was removed from the stream
		///		and won't never be able to open again
		/// 1: Ready to Open
		/// 2: Wating on connection
		/// 3: Opening
		/// 4: Opened
		this.state = 1;

		this.openProm = null;// {resolve, error}

		this.errorListeners = new Listeners;

		this.rmCloseListener = stream.onClose(() => {
			if (this.state < STATE_OPENING)
				return;

			this._closeWithError();
		});
	}

	isReady() {
		return this.state === STATE_OPENED;
	}

	/// If this returns true you will never be able to call open again.
	/// You will need to call newSender on Stream.
	isClosed() {
		return this.state === STATE_CLOSED_FOREVER;
	}

	/// Try to open a sender
	/// 
	/// ## Throws
	/// If the sender is already open or if requesting a sender failed
	async open(req = null) {
		if (this.state === STATE_CLOSED_FOREVER)
			throw new ApiError('Other', 'Sender closed forever');

		if (this.state >= STATE_WAITING_ON_CONNECTION)
			throw new ApiError('Other', 'Sender already opened');

		const prom = new Promise((resolve, error) => {
			this.openProm = { resolve, error };
		});

		try {
			this.state = STATE_WAITING_ON_CONNECTION;
			await this.stream._waitReady();
			this.state = STATE_OPENING;

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

		this.state = STATE_OPENED;
		this.openProm = null;
	}

	// we receive a message from the stream
	_onMsg(msg) {
		switch (msg.kind) {
			// the request was acknowledged
			case 'SenderRequest':
				if (this.state !== STATE_OPENING) {
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
		if (this.state === STATE_OPENING) {
			this.openProm.error(err);
			return;
		}

		this.errorListeners.trigger(err);
		this.state = STATE_READY_TO_OPEN;
	}

	/// ## Throws
	// if could not send the message
	// or if the channel is already closed
	send(msg) {
		if (this.state !== STATE_OPENED)
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

	/// Unregisters the Sender from a Stream. You will need to call newSender
	/// again and cannot just call open.
	/// 
	/// ## Note
	/// This might trigger the error event if sending the senderClosed failed
	/// and the connection get's closed right after that. This still means
	/// You where unregistered from the stream.
	/// 
	/// ## Throws
	/// If the open call is not finished.
	close() {
		if (this.state === STATE_CLOSED_FOREVER)
			return;

		if (
			this.state === STATE_WAITING_ON_CONNECTION ||
			this.state === STATE_OPENING
		)
			throw new ApiError('Other', 'Sender still opening');

		if (this.state === STATE_OPENED) {
			try {
				this.stream._send({
					kind: 'SenderClose',
					action: this.action,
					data: null
				});
			} catch (e) {
				console.log('could not send SenderClose', e);
			}

			this.state === STATE_READY_TO_OPEN;
		}

		this.stream.senders.delete(this.action);
		this.state = STATE_CLOSED_FOREVER;
		this.rmCloseListener();
		this.rmCloseListener = null;
	}
}

export class Receiver {
	constructor(action, stream) {
		this.action = action;
		this.stream = stream;

		/// 0: Closed forever
		/// 	means this receiver was removed from the stream
		///		and won't never be able to open again
		/// 1: Ready to Open
		/// 2: Wating on connection
		/// 3: Opening
		/// 4: Opened
		this.state = 1;

		this.openProm = null;// {resolve, error}

		this.parseFn = d => d;

		this.errorListeners = new Listeners;
		this.messageListeners = new Listeners;

		this.rmCloseListener = stream.onClose(() => {
			if (this.state < STATE_OPENING)
				return;

			this._closeWithError();
		});
	}

	isReady() {
		return this.state === STATE_OPENED;
	}

	/// If this returns true you will never be able to call open again.
	/// You will need to call newReceiver on Stream.
	isClosed() {
		return this.state === STATE_CLOSED_FOREVER;
	}

	/// Try to open a sender
	/// 
	/// ## Throws
	/// If the sender is already open or if requesting a sender failed
	async open(req = null) {
		if (this.state === STATE_CLOSED_FOREVER)
			throw new ApiError('Other', 'Receiver closed forever');

		if (this.state >= STATE_WAITING_ON_CONNECTION)
			throw new ApiError('Other', 'Receiver already opened');

		const prom = new Promise((resolve, error) => {
			this.openProm = { resolve, error };
		});

		try {
			this.state = STATE_WAITING_ON_CONNECTION;
			await this.stream._waitReady();
			this.state = STATE_OPENING;

			this.stream._send({
				kind: 'ReceiverRequest',
				action: this.action,
				data: req
			});

			await prom;
		} catch (e) {
			this.openProm = null;
			throw e;
		}

		this.state = STATE_OPENED;
		this.openProm = null;
	}

	// we receive a message from the stream
	_onMsg(msg) {
		switch (msg.kind) {
			// the request was acknowledged
			case 'ReceiverRequest':
				if (this.state !== STATE_OPENING) {
					console.log('could not open Prom');
					break;
				}

				// send open finished
				this.openProm.resolve();

				break;
			// we receive a new message
			case 'ReceiverMessage':

				const parsed = this.parseFn(msg.data);
				this.messageListeners.trigger(parsed);
				break;
			// the request was closed
			case 'ReceiverClose':

				let error = new ApiError('Other', 'Receiver closed unexpected');

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
		if (this.state === STATE_OPENING) {
			this.openProm.error(err);
			return;
		}

		this.errorListeners.trigger(err);
		this.state = STATE_READY_TO_OPEN;
	}

	// fn (msg)
	onMessage(fn) {
		return this.messageListeners.add(fn);
	}

	// fn(data) -> data
	/// this is not allowed to fail
	setParseFn(fn) {
		this.parseFn = fn;
	}

	/// When you receive this event you know the channel closed.
	/// You can call open again to try to reconnect.
	/// 
	/// Returns a fn to unsubscribe
	onError(fn) {
		return this.errorListeners.add(fn);
	}

	/// Unregisters the Receiver from a Stream. You will need to call
	/// newReceiver again and cannot just call open.
	/// 
	/// ## Note
	/// This might trigger the error event if sending the receiverClosed failed
	/// and the connection get's closed right after that. This still means
	/// You where unregistered from the stream.
	/// 
	/// ## Throws
	/// If the open call is not finished.
	close() {
		this.closeTemporary();

		this.stream.receivers.delete(this.action);
		this.state = STATE_CLOSED_FOREVER;
		this.rmCloseListener();
		this.rmCloseListener = null;
	}

	/// Closes the channel without unregistering on the Stream.
	/// This allows you to call open again later.
	closeTemporary() {
		if (this.state === STATE_CLOSED_FOREVER)
			return;

		if (
			this.state === STATE_WAITING_ON_CONNECTION ||
			this.state === STATE_OPENING
		)
			throw new ApiError('Other', 'Receiver still opening');

		if (this.state === STATE_OPENED) {
			try {
				this.stream._send({
					kind: 'ReceiverClose',
					action: this.action,
					data: null
				});
			} catch (e) {
				console.log('could not send ReceiverClose', e);
			}

			this.state === STATE_READY_TO_OPEN;
		}

		this.state = STATE_READY_TO_OPEN;
	}
}

const STATE_MAN_READY_TO_OPEN = 0;
const STATE_MAN_OPENING = 1;
const STATE_MAN_OPEN = 2;

/// A receiver manager can manage a receiver and allows to start a stream or
/// stop one as required. It works similarly to a normal receiver but you don't
/// call open at the beginning but only when the open event get's called.
export class ReceiverManager {
	// open should call open on the receiver. It is allowed to throw. When an
	// exception occurs the manager will call open again with the exception.
	//
	// open: async (receiver, hasError: bool, error = null)
	constructor(receiver, open) {
		this.receiver = receiver;
		this.openFn = open;

		this.state = STATE_MAN_READY_TO_OPEN;

		this.listeners = 0;

		this.receiver.onError(e => {
			this._onError(e);
		});
	}

	onMessage(fn) {
		this.listeners++;
		const rmFn = this.receiver.onMessage(fn);

		if (this.state === STATE_MAN_READY_TO_OPEN)
			this._open();

		return () => {
			this.listeners--;
			rmFn();

			if (this.listeners === 0)
				this._onClose();
		};
	}

	async _open() {
		this.state = STATE_MAN_OPENING;

		let hasError = false;
		let error = null;

		// this loops is only used until we are connected or nobody is interested
		// in an open channel
		while (true) {
			if (this.listeners === 0) {
				// all listeners are gone
				this.state = STATE_MAN_READY_TO_OPEN;
				break;
			}

			try {
				await this.openFn(this.receiver, hasError, error);

				// the channel is open now
				this.state = STATE_MAN_OPEN;
				break

			} catch (e) {
				// opening failed
				hasError = true;
				error = e;
			}
		}
	}
	
	_onError(e) {
		if (this.state !== STATE_MAN_OPEN) {
			// probably still opening so we don't need to close anything
			return;
		}

		// we had an error and the state is open
		// let's call open
		this._open();
	}

	_onClose() {
		if (this.state !== STATE_MAN_OPEN) {
			// probably still opening so we don't need to close anything
			return;
		}

		// the state is open
		// close without removing
		this.receiver.closeTemporary();
		this.state = STATE_MAN_READY_TO_OPEN;
	}
}