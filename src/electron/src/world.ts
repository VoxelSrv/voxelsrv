import { expose } from 'threads/worker';
import { Server } from 'voxelsrv-server/dist/server';
import * as WebSocket from 'ws';
import { WSSocket } from 'voxelsrv-server/dist/socket';
import { createServer } from 'http';
import { Player } from 'voxelsrv-server/dist/lib/player';

const functions = {
	start(dir: string) {
		const http = createServer();
		let mainPlayer: Player = null;

		const wss = new WebSocket.Server({ noServer: true });

		http.on('upgrade', function upgrade(request, socket, head) {
			wss.handleUpgrade(request, socket, head, function done(ws) {
				wss.emit('connection', ws, request);
			});
		});

		const server = new Server();

		wss.on('connection', (s) => {
			console.log('Player connects!')
			server.connectPlayer(new WSSocket(s));
		});

		server.on('player-join', (player) => {
			if (mainPlayer == null) mainPlayer = player
			let x = 0;
			Object.keys(server.registry.items).forEach((item) => {
				player.inventory.set(x, item, server.registry.items[item].stack, {});
				x = x + 1;
			});
		});

		server.on('player-quit', (player: Player) => {
			if (player.id == mainPlayer.id) server.stopServer();
		});

		server.on('server-stopped', () => {
			console.log('Server stopped')
			process.exit();
		});

		http.listen(0);

		// @ts-ignore
		const x = http.address().port;
		console.log(x);

		return x;

	},
};

expose(functions);
