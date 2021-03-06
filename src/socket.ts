import { spawn, Worker } from 'threads';

import { EventEmitter } from 'events';
import { ProxyHandler } from './lib/gameplay/proxyHandler';
import { gameSettings } from './values';
import { Engine } from 'noa-engine';

let protocol: {
	parseToMessage(type: string, name, data): Promise<Buffer>;
	parseToObject(type: string, data): Promise<{ type: string; data: any }>;
};

export async function createProtocolWorker() {
	const x: any = await spawn(new Worker('./protocol.js'));
	protocol = x;
}

export class BaseSocket {
	socket: any;
	listeners: Object = {};
	server: string;
	world: string;
	singleplayer: boolean = false;
	protocol = protocol;
	noa: Engine;

	constructor() {}

	async send(type: string, data: Object) {
		if (gameSettings.debugSettings.printProtocolToConsole) {
			console.log('s->c', type, data);
		}
	}

	close(x?: number) {
		this.listeners = {};
	}

	protected emit(type, data) {
		if (this.listeners[type] != undefined) {
			this.listeners[type].forEach((func) => {
				func(data);
			});
		}

		if (gameSettings.debugSettings.printProtocolToConsole) {
			console.log('s->c', type, data);
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
			setTimeout(() => this.emit('connection', {}), 50);
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
		super.send(type, data);
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

export class ProxySocket extends BaseSocket {
	handler: ProxyHandler;

	constructor(proxy: string, handler: ProxyHandler) {
		super();
		this.handler = handler;
		this.server = handler.server;
		this.socket = new WebSocket(proxy);
		handler.setSocket(this);

		this.socket.binaryType = 'arraybuffer';

		this.socket.onopen = async () => {
			setTimeout(() => this.emit('connection', {}), 50);
		};

		this.socket.onerror = () => {
			setTimeout(() => this.emit('PlayerKick', { reason: `Can't connect to ${handler.server} (proxy ${proxy})` }), 500);
		};

		this.socket.onclose = () => {
			setTimeout(() => this.emit('PlayerKick', { reason: `Connection closed! (proxy ${proxy})` }), 500);
		};

		this.socket.onmessage = async (data) => {
			const proxyPacket = await protocol.parseToObject('proxy-server', new Uint8Array(data.data));
			if (proxyPacket != null) {
				this.handler.receiveServerMessage(proxyPacket.type, proxyPacket.data);
			}
		};
	}

	async sendReady() {
		this.socket.send(await protocol.parseToMessage('proxy-client', 'Ready', { ready: true }));
	}

	async sendData(data: ArrayBuffer) {
		this.socket.send(await protocol.parseToMessage('proxy-client', 'Data', { message: data }));
	}

	async sendProxy(type: string, data: any) {
		this.socket.send(await protocol.parseToMessage('proxy-client', type, data));
	}

	receive(type: string, data: any) {
		this.emit(type, data);
	}

	async send(type: string, data: Object) {
		super.send(type, data);
		this.handler.receiveClientMessage(type, data);
	}

	close(x?: number) {
		this.listeners = {};
		this.socket.close();
	}
}

export class VirtualSocket extends BaseSocket {
	toClient: EventEmitter;
	toServer: EventEmitter;
	attachedData: any

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
		super.send(type, data);
		this.toServer.emit(type, data);
		this.toServer.emit('packet', type, data);
	}

	close(x?: number) {
		this.listeners = {};
		if (this.closed) return;
		this.closed = true;
		this.toServer.emit('close', x);
	}

	on(type: string, func) {
		this.toClient.on(type, func);
	}
}
