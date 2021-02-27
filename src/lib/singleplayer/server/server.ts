import { fs, vol } from 'memfs';
import { ILoginResponse } from 'voxelsrv-protocol/js/client';
import { Player } from 'voxelsrv-server/dist/lib/player/player';
import { Server } from 'voxelsrv-server/dist/server';
import { BaseSocket } from 'voxelsrv-server/dist/socket';
import { IServerConfig, serverVersion } from 'voxelsrv-server/dist/values';
import { IWorldSettings } from '../../../values';
import { OperatorPermissionHolder } from './operatorPermissionHolder';
import patchWorldClass from './worldPatches';
import patchServerClass from './serverPatches';
import { MessageBuilder } from 'voxelsrv-server/dist/lib/chat';

patchServerClass();
patchWorldClass();

let notLeft = true;
let worldData = false;
let worldSettings: IWorldSettings = null;

let viewDistance = 4;

const server = new Server(false);
server.overrides.worldGenWorkers = ['./', '.js'];

const socket = new BaseSocket('127.0.0.1');

function startServer() {
	if (worldData && worldSettings != null && server.status == 'initiating') {
		server.startServer();
	}
}

socket.send = (type: string, data: Object) => {
	if (type == 'PlayerKick' && server.status != 'active') {
		return;
	}
	self.postMessage({ type, data }, undefined);
};

const emit = (type: string, data: any) => {
	if (socket.listeners[type] != undefined) {
		socket.listeners[type].forEach((func) => {
			func(data);
		});
	}
};

server.on('server-started', () => {
	socket.send('ServerStarted', {});
	server.connectPlayer(socket);
});

server.on('server-config-update', (config: IServerConfig) => {
	config.world.border = worldSettings.worldsize;
	config.world.seed = worldSettings.seed;
	config.world.generator = worldSettings.generator;
	config.viewDistance = viewDistance;
	config.rateLimitChatMessages = false;
	config.public = false;
	config.maxplayers = 1;
	config.consoleInput = false;
	config.chunkTransportCompression = false;
});

server.on('server-stopped', () => {
	socket.send('ServerStopped', { save: vol.toJSON(), settings: worldSettings });
});

self.onmessage = (e) => {
	const type = e.data.type;
	const data = e.data.data;

	switch (type) {
		case 'SingleplayerLeave':
			if (notLeft) {
				server.stopServer();
				notLeft = false;
			}
			break;
		case 'SingleplayerJoin':
			server.connectPlayer(socket);
			break;
		case 'SingleplayerWorldData':
			if (data != undefined) vol.fromJSON(data);
			worldData = true;
			startServer();
			break;
		case 'SingleplayerSettings':
			worldSettings = data;
			worldSettings.serverVersion = serverVersion;
			setupGamemode(server, data.gamemode);
			startServer();
			break;
		case 'SingleplayerViewDistance':
			viewDistance = data.value;
			if (server.status == 'active') {
				server.config.viewDistance = data.value;
			}
			break;
		case 'SingleplayerAutoSave':
			Object.values(server.worlds.worlds).forEach((w) => w.saveAll());
			socket.send('ServerSave', { save: vol.toJSON(), settings: worldSettings });
			break;
		case 'SingleplayerMessage':
			server.players.sendMessageToAll(data.message);
			break;
		case 'LoginResponse':
			const data2: ILoginResponse = data;
			data2.secret = '*localplayer';
			data2.username = 'Player';
			emit(type, data2);
			break;
		default:
			emit(type, data);
	}
};

function setupGamemode(server: Server, gamemode: string) {
	switch (gamemode) {
		case 'creative':
			server.on('player-created', function (player: Player) {
				let x = 0;
				Object.keys(server.registry.items).forEach((item) => {
					player.inventory.set(x, item, server.registry.items[item].stack, {});
					x = x + 1;
				});

				if (player.ipAddress == '127.0.0.1') {
					player.permissions = new OperatorPermissionHolder(player._server.permissions, {}, []);
				}
			});
			break;
		case 'survival':
			break;
	}
}
