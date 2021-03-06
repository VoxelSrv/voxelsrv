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
	ActionInventoryClick,
	IActionInventoryPick,
} from 'voxelsrv-protocol/js/client';
import { IPlayerTeleport, IWorldChunkLoad, UpdateTextBoard } from 'voxelsrv-protocol/js/server';
import { socket } from '../../lib/gameplay/connect';
import { ProxyHandler } from '../../lib/gameplay/proxyHandler';

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

const blockIDMap: { [i: string]: any } = {};
Object.values(blockRegistry).forEach((block) => {
	blockIDMap[block.rawid] = block;
});

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

const border = new ndarray(new Uint16Array(524288).fill(256), [32, 512, 32]);
const floor = new ndarray(new Uint16Array(32768).fill(256), [32, 32, 32]);

export default function connectToClassic30Server(proxyHandler: ProxyHandler) {
	const classic = new Client();
	let inGame = false;
	console.log('Using classic protocol');

	proxyHandler.serverListener = async (data) => {
		classic.deserializer.write(data);
	};

	classic.on('error', (e) => {
		proxyHandler.socket.receive('PlayerKick', { reason: '' + e });
	});

	classic.on('send', (data) => {
		proxyHandler.socket.sendData(classic.serializer.createPacketBuffer(data));
	});

	proxyHandler.ready = () => {
		classic.send('player_identification', {
			protocol_version: 0x07,
			username: proxyHandler.loginData.username,
			verification_key: '',
			unused: 0x00,
		});
	};

	let world: Buffer = null;
	let tempWorld: Buffer = null;
	const worldSize = {
		x: 0,
		y: 0,
		z: 0,
	};
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

	proxyHandler.onClient('ActionMessage', (data: IActionMessage) => {
		classic.send('message', { message: data.message });
	});

	proxyHandler.onClient('ActionBlockBreak', (data: IActionBlockBreak) => {
		let id = 1;
		if (inventory.items[inventory.selected] != undefined) id = blockRegistry[inventory.items[inventory.selected].id].rawid;
		const index = 4 + Math.floor(data.z) + worldSize.z * (Math.floor(data.x) + worldSize.x * Math.floor(data.y));

		if (!blockIDMap[world[index]]?.unbreakable) {
			proxyHandler.socket.receive('WorldBlockUpdate', { x: data.x, y: data.y, z: data.z, id: 0 });
			classic.send('set_block', { x: data.z, y: data.y, z: data.x, mode: 0, block_type: id });
			world[index] = 0;
		}
	});

	proxyHandler.onClient('ActionBlockPlace', (data: IActionBlockPlace) => {
		if (inventory.items[inventory.selected] == undefined) return;
		const block = blockRegistry[inventory.items[inventory.selected].id];

		if (block != undefined) {
			const index = 4 + Math.floor(data.z) + worldSize.z * (Math.floor(data.x) + worldSize.x * Math.floor(data.y));

			proxyHandler.socket.receive('WorldBlockUpdate', { x: data.x, y: data.y, z: data.z, id: block.rawid });
			classic.send('set_block', { x: data.z, y: data.y, z: data.x, block_type: block.rawid, mode: 1 });
			world[index] = block.rawid;
		}
	});

	function updateTab() {
		let message = [];
		Object.values(entities).forEach((x: any) => {
			message.push({ text: x.name + '\n', color: 'white' });
		});

		message.push({ text: proxyHandler.loginData.username, color: 'white' });

		proxyHandler.socket.receive('UpdateTextBoard', { message: message, time: Date.now(), type: UpdateTextBoard.Type.TAB });
	}

	proxyHandler.onClient('ActionInventoryClick', (data: IActionInventoryClick) => {
		if (data.type == ActionInventoryClick.Type.SELECT) {
			inventory.selected = data.slot;
		} else {
			let temp1 = inventory.tempslot;
			let temp2 = inventory.items[data.slot];

			inventory.items[data.slot] = temp1;
			inventory.tempslot = temp2;

			proxyHandler.socket.receive('PlayerSlotUpdate', {
				slot: -1,
				data: JSON.stringify(inventory.tempslot),
				type: 'temp',
			});

			proxyHandler.socket.receive('PlayerSlotUpdate', {
				slot: data.slot,
				data: JSON.stringify(inventory.items[data.slot]),
				type: 'main',
			});
		}
	});

	proxyHandler.onClient('ActionInventoryPick', (data: IActionInventoryPick) => {
		let temp1 = inventory.items[data.slot2];
		let temp2 = inventory.items[data.slot];

		inventory.items[data.slot] = temp1;
		inventory.items[data.slot2] = temp2;

		proxyHandler.socket.receive('PlayerSlotUpdate', {
			slot: data.slot2,
			data: JSON.stringify(inventory.items[data.slot2]),
			type: 'main',
		});

		proxyHandler.socket.receive('PlayerSlotUpdate', {
			slot: data.slot,
			data: JSON.stringify(inventory.items[data.slot]),
			type: 'main',
		});
	});

	proxyHandler.onClient('ActionMove', async (data: IActionMove) => {
		if (!canMove) return;
		if (world != null && data.x >= 0 && data.y >= 0 && data.z >= 0 && data.x <= worldSize.z && data.z <= worldSize.x) {
			const index = 4 + Math.floor(data.z) + worldSize.z * (Math.floor(data.x) + worldSize.x * Math.floor(data.y));

			const id = world[index];
			const block = blockIDMap[id];

			if (id == 0 || block.options.solid == false || block.options.fluid) {
				playerData = { ...playerData, ...data };

				classic.send('position', {
					x: data.z * 32,
					y: data.y * 32 + 51,
					z: data.x * 32,
					yaw: remapYaw(playerData.rotation),
					pitch: remapPitch(playerData.pitch),
				});
			} else {
				proxyHandler.socket.receive('PlayerTeleport', playerData);
			}
		} else {
			proxyHandler.socket.receive('PlayerTeleport', playerData);
		}
	});

	proxyHandler.onClient('ActionMoveLook', async (data: IActionMoveLook) => {
		if (!canMove) return;
		if (world != null && data.x >= 0 && data.y >= 0 && data.z >= 0 && data.x <= worldSize.z && data.z <= worldSize.x) {
			const index = 4 + Math.floor(data.z) + worldSize.z * (Math.floor(data.x) + worldSize.x * Math.floor(data.y));

			const id = world[index];
			const block = blockIDMap[id];

			if (id == 0 || block.options.solid == false || block.options.fluid) {
				playerData = { ...playerData, ...data };

				classic.send('position', {
					x: data.z * 32,
					y: data.y * 32 + 51,
					z: data.x * 32,
					yaw: remapYaw(data.rotation),
					pitch: remapPitch(data.pitch),
				});
			} else {
				proxyHandler.socket.receive('PlayerTeleport', playerData);
			}
		} else {
			proxyHandler.socket.receive('PlayerTeleport', playerData);
		}
	});
	proxyHandler.onClient('ActionLook', async (data: IActionLook) => {
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

	proxyHandler.onClient('ActionClick', (data: IActionClick) => {});

	proxyHandler.onClient('ActionClickEntity', (data: IActionClickEntity) => {});

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

		proxyHandler.socket.receive('ChatMessage', { message: msg });
	});

	classic.on('spawn_player', (d) => {
		if (d.player_id == 255 || d.player_id == -1) {
			proxyHandler.socket.receive('LoginSuccess', {
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
				movement: JSON.stringify(movement),
			});

			playerData = { x: d.z / 32, y: d.y / 32, z: d.x / 32, rotation: 0, pitch: 0 };

			worldPackets.forEach((p) => proxyHandler.socket.receive('WorldChunkLoad', p));

			proxyHandler.socket.receive('PlayerEntity', {
				uuid: `player${d.player_id.toString()}`,
				model: 'player',
				skin: 'skins:' + proxyHandler.loginData.uuid,
			});
			inGame = true;

			const data: IPlayerTeleport = {
				x: d.z / 32,
				y: d.y / 32,
				z: d.x / 32,
			};

			canMove = true;
		} else {
			setTimeout(() => {
				proxyHandler.socket.receive('EntityCreate', {
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
		proxyHandler.socket.receive('EntityRemove', { uuid: `player${d.player_id.toString()}` });
		updateTab();
	});

	classic.on('position_update', (d) => {
		entities[d.player_id].x = entities[d.player_id].x + d.change_in_x;
		entities[d.player_id].y = entities[d.player_id].y + d.change_in_y;
		entities[d.player_id].z = entities[d.player_id].z + d.change_in_z;

		proxyHandler.socket.receive('EntityMove', {
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

		proxyHandler.socket.receive('EntityMove', {
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

		proxyHandler.socket.receive('EntityMove', {
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
			proxyHandler.socket.receive('PlayerTeleport', {
				x: d.z / 32,
				y: d.y / 32,
				z: d.x / 32,
			});
		} else {
			entities[d.player_id].x = d.x;
			entities[d.player_id].y = d.y;
			entities[d.player_id].z = d.z;

			proxyHandler.socket.receive('EntityMove', {
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
		proxyHandler.socket.receive('WorldBlockUpdate', { x: d.z, y: d.y, z: d.x, id: d.block_type });
		const index = 4 + d.x + worldSize.z * (d.z + worldSize.x * d.y);
		world[index] = d.block_type;
	});

	classic.on('disconnect_player', (d) => {
		proxyHandler.socket.receive('PlayerKick', { reason: d.disconnect_reason });
		socket.close();
	});

	classic.on('level_initialize', (d) => {
		proxyHandler.socket.receive('WorldChunksRemoveAll', { confirm: true });
		//@ts-ignore
		socket.noa.world.invalidateVoxelsInAABB({ base: [-1024, -32, -1024], max: [1024, 512, 1024] });
		socket.noa.ents.getPhysics(socket.noa.playerEntity).body.airDrag = 999;

		tempWorld = Buffer.alloc(0);
		inGame = false;
		world = null;
		worldPackets = [];
		proxyHandler.socket.receive('LoginStatus', { message: 'Loading world... 0%', time: Date.now() });
	});

	classic.on('level_data_chunk', (d) => {
		socket.noa.ents.getPhysics(socket.noa.playerEntity).body.airDrag = 999;
		tempWorld = Buffer.concat([tempWorld, d.chunk_data]);
		proxyHandler.socket.receive('LoginStatus', { message: 'Loading world... ' + d.percent_complete + '%', time: Date.now() });
	});

	classic.on('level_finalize', async (d) => {
		proxyHandler.socket.receive('LoginStatus', { message: 'Loading world... 100%', time: Date.now() });
		socket.noa.ents.getPhysics(socket.noa.playerEntity).body.airDrag = 999;

		world = pako.ungzip(tempWorld);

		let i, j, k;
		worldSize.x = d.x_size;
		worldSize.y = d.y_size;
		worldSize.z = d.z_size;

		let i2 = Math.ceil(d.x_size / 32);
		let j2 = Math.ceil(d.y_size / 32);
		let k2 = Math.ceil(d.z_size / 32);

		for (i = 0; i < i2; i++) {
			for (j = 0; j < j2; j++) {
				for (k = 0; k < k2; k++) {
					const chunk = new ndarray(new Uint16Array(32 * 32 * 32), [32, 32, 32]);
					socket.noa.ents.getPhysics(socket.noa.playerEntity).body.airDrag = 999;

					let x, y, z;
					for (x = 0; x < 32; x++) {
						for (y = 0; y < 32; y++) {
							for (z = 0; z < 32; z++) {
								const index = 4 + x + 32 * i + d.z_size * (z + k * 32 + d.x_size * (y + 32 * j));
								if (index < world.length) chunk.set(z, y, x, world[index]);
								else {
									chunk.set(z, y, x, y + 32 * j2 == 66 ? 257 : y < 66 ? 6 : 256);
								}
							}
						}
					}

					const data: IWorldChunkLoad = {
						x: k,
						y: j,
						z: i,
						data: Buffer.from(chunk.data.buffer, chunk.data.byteOffset),
						compressed: false,
						height: 1,
					};

					worldPackets.push(data);
				}
			}
		}
		classic.send('message', { message: 'This user connected to this server with VoxelSrv' });

		const buffer = Buffer.from(border.data.buffer, border.data.byteOffset);
		const fBuffer = Buffer.from(floor.data.buffer, floor.data.byteOffset);

		for (let x = -1; x <= worldSize.z + 1; x++) {
			for (let z = -1; z <= worldSize.x + 1; z++) {
				await new Promise((resolve) => {
					setTimeout(() => resolve(null), 50);
				});
				if (x < 0 || x >= worldSize.z || z < 0 || z >= worldSize.x) {
					const data: IWorldChunkLoad = {
						x: x,
						y: 0,
						z: z,
						data: buffer,
						compressed: false,
						height: 16,
					};

					if (inGame) {
						proxyHandler.socket.receive('WorldChunkLoad', data);
					} else {
						worldPackets.push(data);
					}
				}

				const data: IWorldChunkLoad = {
					x: x,
					y: -1,
					z: z,
					data: fBuffer,
					compressed: false,
					height: 1,
				};

				if (inGame) {
					proxyHandler.socket.receive('WorldChunkLoad', data);
				} else {
					worldPackets.push(data);
				}
			}
		}
		socket.noa.ents.getPhysics(socket.noa.playerEntity).body.airDrag = -1;
	});
}
