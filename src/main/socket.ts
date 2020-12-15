import { spawn, Worker } from 'threads';

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

	constructor() {}

	async send(type: string, data: Object) {}

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

	close() {
		this.listeners = {};
		this.socket.close();
	}
}
