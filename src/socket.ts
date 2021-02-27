import { spawn, Worker } from 'threads';

import { EventEmitter } from 'events';

let protocol: {
	parseToMessage(type: string, name, data): Promise<Buffer>;
	parseToObject(type: string, data): Promise<any>;
};

spawn(new Worker('./protocol.js')).then((x) => {
	// @ts-ignore
	protocol = x;
});

export class BaseSocket {
	socket: any;
	listeners: Object = {};
	server: string;
	world: string;
	singleplayer: boolean = false;

	constructor() {}

	async send(type: string, data: Object) {}

	close(x?: number) {
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

		this.socket.onmessage = async (data) => {
			const packet = await protocol.parseToObject('server', new Uint8Array(data.data));
			if (packet != null) this.emit(packet.type, packet.data);
		};
	}

	async send(type: string, data: Object) {
		const packet = await protocol.parseToMessage('client', type, data);
		if (packet != null) {
			this.socket.send(packet);
		}
	}

	close(x?: number) {
		this.listeners = {};
		this.socket.close();
	}
}

export class VirtualSocket extends BaseSocket {
	toClient: EventEmitter;
	toServer: EventEmitter;

	closed: boolean = false;

	constructor(toClient: EventEmitter, toServer: EventEmitter, server?: string) {
		super();
		this.server = server;
		this.toClient = toClient;
		this.toServer = toServer;

		this.toClient.on('open', () => {
			setTimeout(() => this.toClient.emit('connection', {}), 500);
		});

		this.toClient.on('error', (e: string) => {
			if (this.closed) return;
			this.closed = true;
			setTimeout(() => this.toClient.emit('PlayerKick', { reason: e }), 500);
		});

		this.toClient.on('close', () => {
			if (this.closed) return;
			this.closed = true;
			setTimeout(() => this.toClient.emit('PlayerKick', { reason: `Connection closed!` }), 500);
		});
	}

	async send(type: string, data: Object) {
		this.toServer.emit(type, data);
		this.toServer.emit('packet', type, data);
	}

	close(x?: number) {
		this.listeners = {};
		if (this.closed) return;
		this.closed = true;
		this.toServer.emit('close', x)
	}

	on(type: string, func) {
		this.toClient.on(type, func);
	}
}
