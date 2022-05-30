
import ApiError from './error.js';
import Data from './../data/data.js';
import { timeout } from './../util.js';

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
		this.connecting = false;

		this.connectedListeners = new Set;
		this.closeListeners = new Set;

		// <Action, Sender>
		this.senders = new Map;
		// <Action, Receiver>
		this.receivers = new Map;

		this.persisentReceivers = new Map;
	}

	get connected() {
		return !!this.ws;
	}

	addr() {
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

	/// throws if the connection fails to open
	async connect() {
		if (this.ws)
			return;

		const addr = this.addr();

		if (this.connecting)
			throw new ApiError('Other', 'already connecting');

		this.connecting = true;

		return new Promise((resolve, error) => {
			this.ws = new WebSocket(addr);

			this.ws.addEventListener('close', e => {
				this.ws = null;

				if (this.connecting) {
					this.connecting = false;

					error(new ApiError(
						'ConnectionClosed',
						'WebSocket connection closed'
					));
					return;
				}

				this.privClose();
			});

			this.ws.addEventListener('message', wsMsg => {
				if (typeof wsMsg.data !== 'string')
					return console.log('unrecognized websocket message', wsMsg);

				let protMsg;
				try {
					protMsg = new ProtMessage(JSON.parse(wsMsg.data));
				} catch (e) {
					console.log('failed to deserialize', wsMsg);
					return;
				}

				// not in try since that is a user error which
				// should propagate
				this.handleProtMessage(protMsg);
			});

			const established = () => {
				this.ws.removeEventListener('open', established);
				this.connecting = false;
				this.connectedListeners.forEach(tryFn(fn => fn()));
				resolve();
			};

			this.ws.addEventListener('open', established);
		});
	}

	onConnected(fn) {
		this.connectedListeners.add(fn);

		return () => {
			this.connectedListeners.delete(fn);
		};
	}

	onClose(fn) {
		this.closeListeners.add(fn);

		return () => {
			this.closeListeners.delete(fn);
		};
	}

	close() {
		if (!this.ws)
			return;

		this.ws.close();
	}

	/// returns a Sender
	/// throws if could not transmit the request
	/// or if a sender is already registered
	async newSender(action, request = null) {
		if (this.senders.has(action))
			throw new ApiError('Other', 'sender already exists');

		const sender = new Sender(action, this);
		// should send a Message
		this.privSend({
			kind: 'SenderRequest',
			action,
			data: request
		});

		this.senders.set(action, sender);

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

	newPersistentReceiver(action, request = null) {
		let recv = this.persisentReceivers.get(action);
		if (recv)
			return recv;
		recv = new PersistentReceiver(action, this, request);
		this.persisentReceivers.set(action, recv);
		return recv;
	}

	// priv
	privClose() {
		// and all senders and receivers
		this.senders.forEach(sender => sender.privClose());
		this.senders = new Map;

		// notify all that are interested
		this.closeListeners.forEach(tryFn(fn => fn()));
	}

	// priv
	privSend(protMsg) {
		if (this.ws.readyState !== 1)
			throw new ApiError('Closed', 'connection not ready');

		this.ws.send(JSON.stringify(protMsg));
	}

	// priv
	handleProtMessage(msg) {
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