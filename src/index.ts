//import { isMobile } from 'mobile-device-detect';
const isMobile = false;

import * as cruncher from 'voxel-crunch';
import * as protocol from './lib/protocol';
const ndarray = require('ndarray');
import vec3 = require('gl-vec3');
import { EventEmitter } from 'events';
import Engine from 'noa-engine';
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { registerBlocks, registerItems } from './lib/registry';
import { setChunk } from './lib/world';
import { setupPlayer, setupControls } from './lib/player';
import { playSound } from './lib/sound';
import { applyModel, defineModelComp } from './lib/model';

import { gameSettings, gameProtocol, gameVersion, noaOpts } from './values';
import { constructScreen } from './gui/main';
import setupGuis from './gui/setup';

import { buildMain } from './html-gui/menu/main';
import { Socket } from './socket';

const noa: any = new Engine(noaOpts());
constructScreen(noa);

//@ts-ignore
document.fonts.load('10pt "silkscreen"');

buildMain(connect);

function connect(socket) {
	console.log('Username: ' + gameSettings.nickname, 'Server: ' + socket.server);
	let discreason: string = '';

	socket.on('loginRequest', function (dataLogin) {
		document.getElementById('gui-container').innerHTML = '';

		socket.send('loginResponse', {
			username: gameSettings.nickname,
			protocol: gameProtocol,
			mobile: isMobile,
		});

		socket.on('playerKick', function (data) {
			console.log(`You has been kicked from server \nReason: ${data.reason}`);
			discreason = data.reason;
			return;
		});

		let entityIgnore = 0;
		const entityList = {};

		socket.on('playerEntity', function (data) {
			console.log('Ignoring player-entity: ' + data.uuid);
			entityIgnore = data.uuid;
			if (entityList[data.uuid] != undefined && noa != undefined) noa.ents.deleteEntity(entityList[data.uuid]);
			delete entityList[data.uuid];
		});

		socket.on('loginSuccess', function (dataPlayer) {
			const moveState = noa.inputs.state;
			const chunkList = [];

			registerBlocks(noa, JSON.parse(dataPlayer.blocksDef));
			registerItems(noa, JSON.parse(dataPlayer.itemsDef));

			defineModelComp(noa);
			setupControls(noa, socket);
			setupPlayer(noa, JSON.parse(dataPlayer.inventory), JSON.parse(dataPlayer.armor));

			setupGuis(noa, socket, dataPlayer, dataLogin);

			noa.ents.setPosition(noa.playerEntity, dataPlayer.xPos, dataPlayer.yPos, dataPlayer.zPos);

			socket.on('worldChunk', function (data) {
				chunkList.push(data);
			});

			socket.on('worldBlockUpdate', function (data) {
				noa.setBlock(data.id, data.x, data.y, data.z);
			});

			socket.on('playerInventory', function (data) {
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

			socket.on('playerSlotUpdate', function (data) {
				const item = JSON.parse(data.data);
				console.log(data)
				const inv = noa.ents.getState(noa.playerEntity, 'inventory');

				if (data.type == 'temp') inv.tempslot = item;
				else if (data.type == 'main') inv.items[data.slot] = item;
				else if (data.type == 'armor') inv.armor.items[data.slot] = item;
				else if (data.type == 'hook') inv.hook.items[data.slot] = item;

			});

			socket.on('chatMessage', function (data) {
				//addToChat(data.message);
				console.log('Chat: ' + data.message);
			});

			socket.on('tabUpdate', function (data) {
				//setTab(data.message);
			});

			socket.on('playerTeleport', function (data) {
				noa.ents.setPosition(noa.playerEntity, data.x, data.y, data.z);
				console.log('Teleport: ', data);
			});

			socket.on('playerMovementChange', function (data) {
				const move = noa.ents.getMovement(noa.playerEntity);
				move[data.key] = data.value;
			});

			socket.on('entityCreate', async function (data) {
				if (entityIgnore != data.uuid) {
					const entData = JSON.parse(data.data);
					entityList[data.uuid] = noa.ents.add(Object.values(entData.position), 1, 2, null, null, false, true);

					applyModel(
						entityList[data.uuid],
						entData.model,
						entData.texture,
						entData.offset,
						entData.nametag,
						entData.name,
						entData.hitbox
					);
				}
			});

			socket.on('entityRemove', function (data) {
				if (entityList[data.uuid] != undefined) noa.ents.deleteEntity(entityList[data.uuid]);
				delete entityList[data.uuid];
			});

			socket.on('entityMove', function (data) {
				if (entityList[data.uuid] != undefined) {
					var pos = [data.x, data.y, data.z];
					noa.ents.getState(entityList[data.uuid], 'position').newPosition = pos;
					noa.ents.getState(entityList[data.uuid], 'position').rotation = data.rotation * 2;
				}
			});

			socket.on('soundPlay', function (data) {
				playSound(data.sound, data.volume, data.x != undefined ? [data.x, data.y, data.z] : null, noa);
			});

			const pos = noa.ents.getState(noa.playerEntity, 'position');
			let timerPos = 0;

			setTimeout(function () {
				setInterval(async function () {
					if (chunkList.length != 0) {
						setChunk(chunkList[0], noa);
						chunkList.shift();
					}
				}, 50);
			}, 500);

			let lastPos = [];
			let lastRot = 0;

			noa.on('tick', function () {
				const rot = noa.camera.heading;
				if (JSON.stringify(lastPos) != JSON.stringify(pos.position) || lastRot != rot) {
					lastPos = [...pos.position];
					lastRot = rot;
					socket.send('actionMove', { x: pos.position[0], y: pos.position[1], z: pos.position[2], rotation: noa.camera.heading });
				}
			});
			noa.on('beforeRender', async function () {
				Object.values(entityList).forEach(async function (id: number) {
					const posx = noa.ents.getState(id, 'position').position;
					const newPos = noa.ents.getState(id, 'position').newPosition;
					if (noa.ents.getState(id, noa.entities.names.mesh) != undefined && newPos != undefined && posx != undefined) {
						let move = vec3.create();
						vec3.lerp(move, posx, newPos, 0.1);
						const rot = noa.ents.getState(id, 'position').rotation;
						noa.ents.setPosition(id, move[0], move[1], move[2]);

						const oldRot = noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y;

						if (rot / 2 - oldRot > 5) noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y = rot / 2;
						else noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y = (rot / 2 + oldRot) / 2;

						if (noa.ents.getState(id, 'model').nametag != undefined) {
							noa.ents.getState(id, 'model').nametag.rotation.y =
								noa.camera.heading - noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y;
							noa.ents.getState(id, 'model').nametag.rotation.x = noa.camera.pitch;
						}
					}
				});
			});
		});
	});

	socket.onclose = function () {};
}

window['connect'] = (x) => {
	connect(new Socket(x));
};

window.onload = function () {
	if (isMobile) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'mobile.css';
		document.head.appendChild(link);
		document.documentElement.addEventListener('click', function () {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen();
			}
		});
	}

	// Default actions
	const options = new URLSearchParams(window.location.search);

	if (!!options.get('server')) {
		const socket = new Socket('ws://' + options.get('server'));
		connect(socket);
	}
};
