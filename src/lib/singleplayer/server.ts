import { Server } from 'voxelsrv-server/dist/server';
import { BaseSocket } from 'voxelsrv-server/dist/socket';

const server = new Server();

const socket = new BaseSocket('127.0.0.1');

socket.send = (type: string, data: Object) => {
	self.postMessage({ type, data }, '');
};

const emit = (type: string, data: any) => {
	if (socket.listeners[type] != undefined) {
		socket.listeners[type].forEach((func) => {
			func(data);
		});
	}
};

server.on('server-stopped', () => {
	self.postMessage({ type: 'ServerStopped', data: {} }, '');
})


self.onmessage = ({ type, data }) => {
	if (type.startsWith('Singleplayer')) {
		switch (type) {
			case 'SingleplayerLeave':
				server.stopServer();
				break;
			case 'SingleplayerJoin':
				server.connectPlayer(socket);
				break;

		}
	} else emit(type, data);
};
