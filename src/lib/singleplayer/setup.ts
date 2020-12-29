import { VirtualSocket } from '../../socket';
import { EventEmitter } from 'events';

export function createSingleplayerServer() {
	const toServer = new EventEmitter();
	const toClient = new EventEmitter();

	const socket = new VirtualSocket(toClient, toServer);

	const server = new Worker('./server.js');

	server.onmessage = ({ type, data }) => {
		toClient.emit(type, data);
	};

	toServer.on('packet', (type, data) => {
		server.postMessage({ type, data });
	});

	return socket;
}
