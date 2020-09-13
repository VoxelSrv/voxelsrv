import * as protocol from './lib/protocol';

export class BaseSocket {
	socket: any;
	listeners: Object;
	server: string;

	constructor() {
		this.listeners = {};
	}

	send(type, data) {
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

export class Socket extends BaseSocket {
	constructor(server: string) {
		super();
		this.server = server;

		this.socket = new WebSocket(server);

		console.log(this.socket);
		this.socket.binaryType = 'arraybuffer';

		this.socket.onopen = () => {
			setTimeout(() => this.emit('connection', {}), 100);
		};

		this.socket.onerror = () => {
			setTimeout(() => this.emit('PlayerKick', { reason: `Can't connect to ${server}` }), 100);
		};

		this.socket.onclose = () => {
			setTimeout(() => this.emit('PlayerKick', { reason: `Connection closed!` }), 100);
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
