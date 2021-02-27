import { EventEmitter } from 'events';
import { BaseSocket, VirtualSocket } from '../../socket';

import * as protocol from 'voxelsrv-protocol';
import { Client } from './lib/client';
import * as ndarray from 'ndarray';

import * as pako from 'pako';

import { items as itemRegistry, blocks as blockRegistry } from './lib/registry.json';
import {
	IActionMessage,
	IActionBlockBreak,
	IActionBlockPlace,
	IActionInventoryClick,
	IActionMove,
	IActionMoveLook,
	IActionLook,
	IActionClick,
	IActionClickEntity,
	ILoginResponse,
	ActionInventoryClick,
	IActionInventoryPick,
} from 'voxelsrv-protocol/js/client';
import { IPlayerTeleport, IWorldChunkLoad, UpdateTextBoard } from 'voxelsrv-protocol/js/server';
import { socket } from '../../lib/gameplay/connect';

const colormap = {
	'1': 'blue',
	'2': 'green',
	'3': 'cyan',
	'4': 'red',
	'5': 'purple',
	'6': 'orange',
	'7': 'lightgray',
	'8': 'gray',
	'9': 'indigo',
	a: 'lime',
	b: 'lightblue',
	c: 'lightred',
	d: 'magenta',
	e: 'yellow',
	f: 'white',
};

function invItems() {
	const items = {};
	let x = 0;

	Object.values(itemRegistry).forEach((item) => {
		items[x] = {
			id: item.id,
			count: 1,
			data: {},
		};
		x = x + 1;
	});
	return items;
}

function remapPitch(n) {
	// Head
	let x = Math.floor((n / 6.29) * 255) + 0;
	if (x < 0) x = x + 255;

	if (x > 255 || x < 0) x = 0;

	return x;
}

function remapYaw(n) {
	// Rotation
	let x = Math.floor((n / 6.29) * 255) + 64;
	if (x > 255) x = x - 255;

	if (x > 255 || x < 0) x = 0;

	return x;
}

function replaceAll(text: string, toRep: string, out: string): string {
	let x1 = text;
	let x2 = text.replace(toRep, out);
	while (x1 != x2) {
		x1 = x2;
		x2 = x1.replace(toRep, out);
	}
	return x1;
}

const movement = {
	airJumps: 0,
	airMoveMult: 0.5,
	crouch: false,
	crouchMoveMult: 0.8,
	jumpForce: 6,
	jumpImpulse: 8.5,
	jumpTime: 500,
	jumping: false,
	maxSpeed: 6,
	moveForce: 30,
	responsiveness: 15,
	running: false,
	runningFriction: 0,
	sprint: false,
	sprintMoveMult: 1.2,
	standingFriction: 2,
};

export default function connectToClassic30Server(proxyIp: string, server: string): BaseSocket {
	const toClient = new EventEmitter();
	const toServer = new EventEmitter();

	server = server.replace('*', '');

	const proxy = new WebSocket(proxyIp);
	proxy.binaryType = 'arraybuffer';

	const classic = new Client();


	const vSocket = new VirtualSocket(toClient, toServer, server);

	console.log('Using classic protocol');

	proxy.onmessage = async (data) => {
		const packet = protocol.parseToObject('proxy-server', new Uint8Array(data.data));
		if (packet != null) {
			if (packet.type == 'Data') {
				classic.deserializer.write(packet.data.message);
			}
		}
	};

	proxy.onclose = async () => {
		console.log(1);
		toClient.emit('PlayerKick', { reason: 'Connection closed!' });
	};

	proxy.onopen = () => {
		console.log('Connected to server!')
		setTimeout(() => {
			toClient.emit('LoginRequest', {});
		}, 1400);
	}

	toClient.on('close', () => {
		proxy.close();
	});

	toServer.on('close', () => {
		toClient.removeAllListeners();
		toServer.removeAllListeners();
		proxy.close();
	});

	classic.on('error', (e) => {
		toClient.emit('PlayerKick', { reason: '' + e });
	});

	classic.on('send', (data) => {
		proxy.send(protocol.parseToMessage('proxy-client', 'Data', { message: classic.serializer.createPacketBuffer(data) }));
	});

	toServer.on('LoginResponse', (data: ILoginResponse) => {
		const AuthRequest = protocol.parseToMessage('proxy-client', 'AuthRequest', {
			username: data.username,
			protoco: data.protocol,
			client: data.client,
			uuid: data.uuid,
			secret: data.secret,
			serverId: server.replace('c0.30|', ''),
		});

		proxy.send(AuthRequest);

		classic.send('player_identification', {
			protocol_version: 0x07,
			username: data.username,
			verification_key: '',
			unused: 0x00,
		});

		let world: Buffer = null;
		let tempWorld: Buffer = null;
		let canMove = false;
		let worldPackets = [];
		const entities = {};
		let playerData = {
			x: 0,
			y: 0,
			z: 0,
			rotation: 0,
			pitch: 0,
		};
		let inventory = {
			items: invItems(),
			size: 49,
			tempslot: {},
			selected: 0,
		};

		toServer.on('ActionMessage', (data: IActionMessage) => {
			classic.send('message', { message: data.message });
		});

		toServer.on('ActionBlockBreak', (data: IActionBlockBreak) => {
			let id = 1;
			if (inventory.items[inventory.selected] != undefined) id = blockRegistry[inventory.items[inventory.selected].id].rawid;
			classic.send('set_block', { x: data.z, y: data.y, z: data.x, mode: 0, block_type: id });
		});

		toServer.on('ActionBlockPlace', (data: IActionBlockPlace) => {
			if (inventory.items[inventory.selected] == undefined) return;
			const block = blockRegistry[inventory.items[inventory.selected].id];
			if (block != undefined) classic.send('set_block', { x: data.z, y: data.y, z: data.x, block_type: block.rawid, mode: 1 });
		});

		function updateTab() {
			let message = [];
			Object.values(entities).forEach((x: any) => {
				message.push({ text: x.name + '\n', color: 'white' });
			});

			message.push({ text: data.username, color: 'white' });

			toClient.emit('UpdateTextBoard', { message: message, time: Date.now(), type: UpdateTextBoard.Type.TAB });
		}

		toServer.on('ActionInventoryClick', (data: IActionInventoryClick) => {
			if (data.type == ActionInventoryClick.Type.SELECT) {
				inventory.selected = data.slot;
			} else {
				let temp1 = inventory.tempslot;
				let temp2 = inventory.items[data.slot];

				inventory.items[data.slot] = temp1;
				inventory.tempslot = temp2;

				toClient.emit('PlayerSlotUpdate', {
					slot: -1,
					data: JSON.stringify(inventory.tempslot),
					type: 'temp',
				});

				toClient.emit('PlayerSlotUpdate', {
					slot: data.slot,
					data: JSON.stringify(inventory.items[data.slot]),
					type: 'main',
				});
			}
		});

		toServer.on('ActionInventoryPick', (data: IActionInventoryPick) => {
			let temp1 = inventory.items[data.slot2];
			let temp2 = inventory.items[data.slot];

			inventory.items[data.slot] = temp1;
			inventory.items[data.slot2] = temp2;

			toClient.emit('PlayerSlotUpdate', {
				slot: data.slot2,
				data: JSON.stringify(inventory.items[data.slot2]),
				type: 'main',
			});

			toClient.emit('PlayerSlotUpdate', {
				slot: data.slot,
				data: JSON.stringify(inventory.items[data.slot]),
				type: 'main',
			});
			
		});

		toServer.on('ActionMove', async (data: IActionMove) => {
			if (!canMove) return;

			playerData = { ...playerData, ...data };

			classic.send('position', {
				x: data.z * 32,
				y: data.y * 32 + 51,
				z: data.x * 32,
				yaw: remapYaw(playerData.rotation),
				pitch: remapPitch(playerData.pitch),
			});
		});

		toServer.on('ActionMoveLook', async (data: IActionMoveLook) => {
			if (!canMove) return;

			playerData = { ...playerData, ...data };

			classic.send('position', {
				x: data.z * 32,
				y: data.y * 32 + 51,
				z: data.x * 32,
				yaw: remapYaw(data.rotation),
				pitch: remapPitch(data.pitch),
			});
		});
		toServer.on('ActionLook', async (data: IActionLook) => {
			if (!canMove) return;

			playerData = { ...playerData, ...data };

			classic.send('position', {
				x: playerData.z * 32,
				y: playerData.y * 32 + 51,
				z: playerData.x * 32,
				yaw: remapYaw(data.rotation),
				pitch: remapPitch(data.pitch),
			});
		});

		toServer.on('ActionClick', (data: IActionClick) => {});

		toServer.on('ActionClickEntity', (data: IActionClickEntity) => {});

		classic.on('message', (d) => {
			const text: string[] = d.message.split(/(&[0-9a-fA-F])/);

			const msg = [{ text: '', color: 'white' }];
			let x = 0;
			for (x = 0; x < text.length; x++) {
				if (text[x] == undefined) continue;
				else if (text[x][0] == '&' && /([kmobnr])/.test(text[x][1])) continue;
				else if (text[x][0] == '&' && /([0-9a-fA-F])/.test(text[x][1])) {
					msg.push({ text: '', color: colormap[text[x][1]] });
				} else {
					msg[msg.length - 1].text = msg[msg.length - 1].text + text[x];
				}
			}

			toClient.emit('ChatMessage', { message: msg });
		});

		classic.on('spawn_player', (d) => {
			if (d.player_id == 255 || d.player_id == -1) {
				toClient.emit('LoginSuccess', {
					xPos: d.z / 32,
					yPos: d.y / 32,
					zPos: d.x / 32,
					inventory: JSON.stringify(inventory),
					blocksDef: JSON.stringify(blockRegistry),
					itemsDef: JSON.stringify(itemRegistry),
					armor: JSON.stringify({
						items: {},
						selected: 0,
						size: 0,
					}),
					allowCheats: false,
					allowCustomSkins: true,
					movement: JSON.stringify(movement),
				});

				toClient.emit('PlayerEntity', { uuid: `player${d.player_id.toString()}` });

				const data: IPlayerTeleport = {
					x: d.z / 32,
					y: d.y / 32,
					z: d.x / 32,
				};
				toClient.emit('PlayerTeleport', data);
				worldPackets.forEach((p) => toClient.emit('WorldChunkLoad', p));

				setTimeout(() => {
					canMove = true;
				}, 100);
			} else {
				setTimeout(() => {
					toClient.emit('EntityCreate', {
						uuid: `player${d.player_id.toString()}`,
						data: JSON.stringify({
							position: [0, 0, 0],
							model: 'player',
							texture: 'entity/steve',
							type: 'player',
							name: d.player_name,
							nametag: true,
							maxHealth: 20,
							health: 20,
							rotation: 1,
							pitch: 1,
							hitbox: [0.55, 1.9, 0.55],
							armor: { items: { 0: {}, 1: {}, 2: {}, 3: {} }, size: 4, selected: 0 },
						}),
					});
				}, 50);

				entities[d.player_id] = {
					id: `player${d.player_id.toString()}`,
					x: d.x,
					y: d.y,
					z: d.z,
					name: d.player_name,
				};
			}

			updateTab();
		});

		classic.on('despawn_player', (d) => {
			if (entities[d.player_id] != undefined) delete entities[d.player_id];
			toClient.emit('EntityRemove', { uuid: `player${d.player_id.toString()}` });
			updateTab();
		});

		classic.on('position_update', (d) => {
			entities[d.player_id].x = entities[d.player_id].x + d.change_in_x;
			entities[d.player_id].y = entities[d.player_id].y + d.change_in_y;
			entities[d.player_id].z = entities[d.player_id].z + d.change_in_z;

			toClient.emit('EntityMove', {
				uuid: entities[d.player_id].id,
				x: entities[d.player_id].z / 32,
				y: (entities[d.player_id].y - 51) / 32,
				z: entities[d.player_id].x / 32,
				rotation: ((entities[d.player_id].rotation - 64) / 255) * 6.28,
				yaw: (entities[d.player_id].yaw / 255) * 6.28,
			});
		});

		classic.on('position_and_orientation_update', (d) => {
			entities[d.player_id].x = entities[d.player_id].x + d.change_in_x;
			entities[d.player_id].y = entities[d.player_id].y + d.change_in_y;
			entities[d.player_id].z = entities[d.player_id].z + d.change_in_z;
			entities[d.player_id].rotation = d.yaw;
			entities[d.player_id].yaw = d.pitch;

			toClient.emit('EntityMove', {
				uuid: entities[d.player_id].id,
				x: entities[d.player_id].z / 32,
				y: (entities[d.player_id].y - 51) / 32,
				z: entities[d.player_id].x / 32,
				rotation: ((entities[d.player_id].rotation - 64) / 255) * 6.28,
				yaw: (entities[d.player_id].yaw / 255) * 6.28,
			});
		});

		classic.on('orientation_update', (d) => {
			entities[d.player_id].rotation = d.yaw;
			entities[d.player_id].yaw = d.pitch;

			toClient.emit('EntityMove', {
				uuid: entities[d.player_id].id,
				x: entities[d.player_id].z / 32,
				y: (entities[d.player_id].y - 51) / 32,
				z: entities[d.player_id].x / 32,
				rotation: ((entities[d.player_id].rotation - 64) / 255) * 6.28,
				yaw: (entities[d.player_id].yaw / 255) * 6.28,
			});
		});

		classic.on('player_teleport', (d) => {
			if (d.player_id == 255 || d.player_id == -1) {
				toClient.emit('PlayerTeleport', {
					x: d.z / 32,
					y: d.y / 32,
					z: d.x / 32,
				});
			} else {
				entities[d.player_id].x = d.x;
				entities[d.player_id].y = d.y;
				entities[d.player_id].z = d.z;

				toClient.emit('EntityMove', {
					uuid: entities[d.player_id].id,
					x: entities[d.player_id].z / 32,
					y: (entities[d.player_id].y - 51) / 32,
					z: entities[d.player_id].x / 32,
					rotation: ((entities[d.player_id].rotation - 64) / 255) * 6.28,
					yaw: entities[d.player_id].yaw / 3.14,
				});
			}
		});

		classic.on('disconnect', () => {
			socket.close();
		});

		classic.on('set_block', (d) => {
			toClient.emit('WorldBlockUpdate', { x: d.z, y: d.y, z: d.x, id: d.block_type });
		});

		classic.on('disconnect_player', (d) => {
			toClient.emit('PlayerKick', { reason: d.disconnect_reason });
			socket.close();
		});

		classic.on('level_initialize', (d) => {
			tempWorld = Buffer.alloc(0);
			world = null;
			worldPackets = [];
			toClient.emit('LoginStatus', { message: 'Loading world... 0%', time: Date.now() });
		});

		classic.on('level_data_chunk', (d) => {
			tempWorld = Buffer.concat([tempWorld, d.chunk_data]);
			toClient.emit('LoginStatus', { message: 'Loading world... ' + d.percent_complete + '%', time: Date.now() });
		});

		classic.on('level_finalize', (d) => {
			toClient.emit('LoginStatus', { message: 'Loading world... 100%', time: Date.now() });

			world = pako.ungzip(tempWorld);

			let i, j, k;

			let i2 = Math.ceil(d.x_size / 32);
			let j2 = Math.ceil(d.y_size / 32);
			let k2 = Math.ceil(d.z_size / 32);

			for (i = 0; i < i2; i++) {
				for (j = 0; j < j2; j++) {
					for (k = 0; k < k2; k++) {
						const chunk = new ndarray(new Uint16Array(32 * 32 * 32), [32, 32, 32]);

						let x, y, z;
						for (x = 0; x < 32; x++) {
							for (y = 0; y < 32; y++) {
								for (z = 0; z < 32; z++) {
									const index = 4 + x + 32 * i + d.z_size * (z + k * 32 + d.x_size * (y + 32 * j));
									if (index < world.length) chunk.set(z, y, x, world[index]);
								}
							}
						}

						const data: IWorldChunkLoad = {
							x: k,
							y: j,
							z: i,
							data: Buffer.from(chunk.data.buffer, chunk.data.byteOffset),
							compressed: false,
							height: 1
						};

						worldPackets.push(data);
					}
				}
			}

			classic.send('message', { message: 'This user connected to this server with VoxelSrv' });

		});
	});

	return vSocket;
}
