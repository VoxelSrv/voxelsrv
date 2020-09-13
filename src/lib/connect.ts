import { gameSettings, gameProtocol, gameVersion, updateServerSettings } from '../values';
import { isMobile } from 'mobile-device-detect';
import { buildMainMenu, holder } from '../gui/menu/main';
import { setupGuis, destroyGuis } from '../gui/setup';
import buildDisconnect from '../gui/menu/disconnect';
import { addMessage } from '../gui/chat';
import { setupPlayer } from './player';
import { applyModel } from './model';
import { registerBlocks, registerItems } from './registry';
import { setChunk, setupAutoload } from './world';
import { playSound } from './sound';
import { cloudMesh, setupClouds } from './sky';

const ndarray = require('ndarray');
import vec3 = require('gl-vec3');
import { BaseSocket } from '../socket';

export let socket: BaseSocket | null = null;
let chunkInterval: any = null;
let entityEvent: Function | null = null;
let moveEvent: Function | null = null;

export function socketSend(type, data) {
	if (socket != undefined) socket.send(type, data);
}

let noa;

export function disconnect() {
	socket.close();
	stopListening(noa);
	destroyGuis();
	updateServerSettings({ ingame: false });
	buildMainMenu(noa, connect);
}

export function connect(noax, socketx) {
	noa = noax;
	noa.worldName = 'World' + Math.round(Math.random() * 1000);
	socket = socketx;
	console.log('Username: ' + gameSettings.nickname, 'Server: ' + socket.server);
	let discreason: string = '';
	if (holder != null) holder.dispose();

	socket.on('PlayerKick', function (data) {
		socket.close();
		console.log(`You has been kicked from server \nReason: ${data.reason}`);
		stopListening(noa);
		destroyGuis();
		buildDisconnect(data.reason, noa, connect);
		updateServerSettings({ ingame: false });
		return;
	});

	socket.on('LoginRequest', function (dataLogin) {
		updateServerSettings({ ingame: true });
		noa.camera.heading = 0;
		noa.camera.pitch = 0;

		socket.send('LoginResponse', {
			username: gameSettings.nickname,
			protocol: gameProtocol,
			mobile: isMobile,
		});

		let entityIgnore = 0;
		const entityList = {};

		socket.on('PlayerEntity', function (data) {
			console.log('Ignoring player-entity: ' + data.uuid);
			entityIgnore = data.uuid;
			if (entityList[data.uuid] != undefined && noa != undefined) noa.ents.deleteEntity(entityList[data.uuid]);
			delete entityList[data.uuid];
		});

		socket.on('LoginSuccess', function (dataPlayer) {
			const moveState = noa.inputs.state;
			const chunkList = [];

			registerBlocks(noa, JSON.parse(dataPlayer.blocksDef));
			registerItems(noa, JSON.parse(dataPlayer.itemsDef));

			setupPlayer(noa, JSON.parse(dataPlayer.inventory), JSON.parse(dataPlayer.armor));

			cloudMesh.dispose();
			setupClouds(noa);

			setupGuis(noa, socket, dataPlayer, dataLogin);

			setupAutoload(noa, socket);

			noa.ents.setPosition(noa.playerEntity, dataPlayer.xPos, dataPlayer.yPos, dataPlayer.zPos);

			socket.on('WorldChunkLoad', function (data) {
				chunkList.push(data);
			});

			socket.on('WorldChunkUnload', function (data) {
				if (data.type) {
					for (let x = 0; x <= 8; x++) noa.world.removeChunk(`${data.x}|${x}|${data.z}`);
				} else noa.world.removeChunk(`${data.x}|${data.y}|${data.z}`);
			});

			socket.on('WorldBlockUpdate', function (data) {
				noa.setBlock(data.id, data.x, data.y, data.z);
			});

			socket.on('PlayerInventory', function (data) {
				const inv = JSON.parse(data.inventory);
				if (data.type == 'armor') {
					noa.ents.getState(noa.playerEntity, 'inventory').armor = inv;
				} else if (data.type == 'hook') {
					noa.ents.getState(noa.playerEntity, 'inventory').hook = inv;
				} else {
					noa.ents.getState(noa.playerEntity, 'inventory').items = inv.items;
					noa.ents.getState(noa.playerEntity, 'inventory').tempslot = inv.tempslot;
				}
			});

			socket.on('PlayerSlotUpdate', function (data) {
				const item = JSON.parse(data.data);
				const inv = noa.ents.getState(noa.playerEntity, 'inventory');

				if (data.type == 'temp') inv.tempslot = item;
				else if (data.type == 'main') inv.items[data.slot] = item;
				else if (data.type == 'armor') inv.armor.items[data.slot] = item;
				else if (data.type == 'hook') inv.hook.items[data.slot] = item;
			});

			socket.on('ChatMessage', function (data) {
				addMessage(data.message);
			});

			socket.on('TabUpdate', function (data) {
				//setTab(data.message);
			});

			socket.on('PlayerTeleport', function (data) {
				noa.ents.setPosition(noa.playerEntity, data.x, data.y, data.z);
			});

			socket.on('PlayerUpdateMovement', function (data) {
				const move = noa.ents.getMovement(noa.playerEntity);
				move[data.key] = data.value;
			});

			socket.on('PlayerUpdatePhysics', function (data) {
				const move = noa.ents.getPhysicsBody(noa.playerEntity);
				move[data.key] = data.value;
			});

			socket.on('PlayerApplyImpulse', function (data) {
				noa.ents.getPhysicsBody(noa.playerEntity).applyImpulse([data.x, data.y, data.z]);
			});

			socket.on('EntityCreate', async function (data) {
				if (entityIgnore != data.uuid) {
					const entData = JSON.parse(data.data);
					entityList[data.uuid] = noa.ents.add(Object.values(entData.position), 1, 2, null, null, false, true);

					applyModel(entityList[data.uuid], data.uuid, entData.model, entData.texture, entData.offset, entData.nametag, entData.name, entData.hitbox);
				}
			});

			socket.on('EntityRemove', function (data) {
				if (entityList[data.uuid] != undefined) noa.ents.deleteEntity(entityList[data.uuid]);
				delete entityList[data.uuid];
			});

			socket.on('EntityMove', function (data) {
				if (entityList[data.uuid] != undefined) {
					var pos = [data.x, data.y, data.z];
					noa.ents.getState(entityList[data.uuid], 'position').newPosition = pos;
					noa.ents.getState(entityList[data.uuid], 'position').rotation = data.rotation * 2;
					noa.ents.getState(entityList[data.uuid], 'position').pitch = data.pitch * 2;
				}
			});

			socket.on('SoundPlay', function (data) {
				playSound(data.sound, data.volume, data.x != undefined ? [data.x, data.y, data.z] : null, noa);
			});

			const pos = noa.ents.getState(noa.playerEntity, 'position');
			let timerPos = 0;

			setTimeout(function () {
				chunkInterval = setInterval(async function () {
					if (chunkList.length != 0) {
						setChunk(chunkList[0], noa);
						chunkList.shift();
					}
				}, 50);
			}, 500);

			let lastPos = [];
			let lastRot = 0;
			let lastPitch = 0;

			moveEvent = () => {
				const rot = noa.camera.heading;
				const pitch = noa.camera.pitch;
				if (JSON.stringify(lastPos) != JSON.stringify(pos.position) || lastRot != rot || lastPitch != pitch) {
					lastPos = [...pos.position];
					lastRot = rot;
					socket.send('ActionMove', { x: pos.position[0], y: pos.position[1], z: pos.position[2], rotation: rot, pitch: pitch });
				}
			};

			noa.on('tick', moveEvent);

			entityEvent = async function () {
				Object.values(entityList).forEach(async function (id: number) {
					const posx = noa.ents.getState(id, 'position').position;
					const newPos = noa.ents.getState(id, 'position').newPosition;
					const mainMesh = noa.ents.getState(id, noa.entities.names.mesh);
					const model = noa.ents.getState(id, 'model');
					if (mainMesh != undefined && newPos != undefined && posx != undefined) {
						let move = vec3.create();
						vec3.lerp(move, posx, newPos, 0.1);
						const rot = noa.ents.getState(id, 'position').rotation;
						const pitch = noa.ents.getState(id, 'position').pitch;
						noa.ents.setPosition(id, move[0], move[1], move[2]);

						const pos2da = [newPos[0], 0, newPos[2]];
						const pos2db = [posx[0], 0, posx[2]];

						if (model.x == undefined) {
							model.x = 0;
							model.y = 0;
							model.z = false;
						}

						let sin = Math.sin(model.x);
						if (vec3.distance(pos2da, pos2db) > 0.05) {
							model.y = vec3.distance(pos2da, pos2db) / 5;
							model.x = model.x + model.y;
							if (Math.abs(sin) > 0.95) model.z = true;
							else if (Math.abs(sin) < 0.05) model.z = false;
						} else {
							const sin2 = parseFloat(sin.toFixed(1));
							if (sin2 != 0 && !model.z) model.x = model.x - 0.05;
							if (sin2 != 0 && model.z) model.x = model.x + 0.05;
						}

						model.models.left_arm.rotation.x = -sin;
						model.models.right_arm.rotation.x = sin;
						model.models.right_leg.rotation.x = -sin;
						model.models.left_leg.rotation.x = sin;

						const oldRot = mainMesh.mesh.rotation.y;

						if (rot / 2 - oldRot > 5) mainMesh.mesh.rotation.y = rot / 2;
						else mainMesh.mesh.rotation.y = (rot / 2 + oldRot) / 2;

						model.models.head.rotation.x = pitch / 2;

						if (model.nametag != undefined) {
							model.nametag.rotation.y = noa.camera.heading - mainMesh.mesh.rotation.y;
							model.nametag.rotation.x = noa.camera.pitch;
						}
					}
				});
			};

			noa.on('beforeRender', entityEvent);

			let checker = setInterval(() => {
				if (noa.world.playerChunkLoaded) {
					noa.ents.getPhysics(noa.playerEntity).body.airDrag = -1;
					clearInterval(checker);
				}
			}, 1);
		});
	});
}

export function stopListening(noa) {
	if (moveEvent != null) noa.off('tick', moveEvent);
	if (moveEvent != null) noa.off('beforeRender', entityEvent);
	if (chunkInterval != null) clearInterval(chunkInterval);
}
