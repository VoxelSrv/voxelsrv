import * as protocol from './lib/protocol';
import Peer from 'peerjs';

export class BaseSocket {
	socket: any;
	listeners: Object = {};
	server: string;

	constructor() {}

	send(type: string, data: Object) {
		const packet = protocol.parseToMessage('client', type, data);
		if (packet != null) {
			this.socket.send(packet);
		}
	}

	close() {
		this.listeners = {};
	}

	protected emit(type, data) {
		if (this.listeners[type] != undefined) {
			this.listeners[type].forEach((func) => {
				func(data);
			});
		}
	}

	on(type: string, func: Function) {
		if (this.listeners[type] != undefined) {
			this.listeners[type].push(func);
		} else {
			this.listeners[type] = new Array();
			this.listeners[type].push(func);
		}
	}
}

export class MPSocket extends BaseSocket {
	constructor(server: string) {
		super();
		this.server = server;
		this.socket = new WebSocket(server);

		this.socket.binaryType = 'arraybuffer';

		this.socket.onopen = () => {
			setTimeout(() => this.emit('connection', {}), 500);
		};

		this.socket.onerror = () => {
			setTimeout(() => this.emit('PlayerKick', { reason: `Can't connect to ${server}` }), 500);
		};

		this.socket.onclose = () => {
			setTimeout(() => this.emit('PlayerKick', { reason: `Connection closed!` }), 500);
		};

		this.socket.onmessage = (data) => {
			const packet = protocol.parseToObject('server', new Uint8Array(data.data));
			if (packet != null) this.emit(packet.type, packet.data);
		};
	}

	close() {
		this.listeners = {};
		this.socket.close();
	}
}

export class PeerSocket extends BaseSocket {
	peer: Peer;
	socket: Peer.DataConnection;
	constructor(server: string) {
		super();
		this.server = server;
		this.peer = new Peer();

		this.socket = this.peer.connect(server);

		console.log(`Your peer id: ${this.peer.id}`);

		this.socket.on('open', () => setTimeout(() => this.emit('connection', {}), 500));
		this.socket.on('close', () => setTimeout(() => this.emit('PlayerKick', { reason: `Connection closed!` }), 500));
		this.socket.on('error', () => setTimeout(() => this.emit('PlayerKick', { reason: `Can't connect to peer` }), 500));
		this.socket.on('data', (data) => {
			const packet = protocol.parseToObject('server', new Uint8Array(data.data));
			if (packet != null) this.emit(packet.type, packet.data);
		});
	}

	close() {
		this.listeners = {};
		this.socket.close();
	}
}
