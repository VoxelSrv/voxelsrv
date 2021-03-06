/*
 * This needs major cleanup as it's way too big and it will be bigger in future.
 */

import {
	gameSettings,
	gameProtocol,
	updateServerSettings,
	gameVersion,
	defaultValues,
	proxyServer,
	IServerInfo,
	getServerList,
	heartbeatServer,
	getAuthInfo,
} from '../../values';
import { isMobile } from 'mobile-device-detect';
import { buildMainMenu, holder } from '../../gui/menu/main';
import { setupGuis, destroyGuis } from '../../gui/setup';
import { addMessage } from '../../gui/ingame/chat';
import { setupPlayerEntity } from '../player/entity';
import { addNametag, applyModel } from '../helpers/model';
import { registerBlocks, registerItems } from './registry';
import { setChunk, clearStorage, removeChunk, chunkSetBlock, chunkExist } from './world';
import { playSound } from './sound';
import { cloudMesh, setupClouds, setupSky, skyMesh } from './sky';

import * as BABYLON from '@babylonjs/core/Legacy/legacy';

import * as vec3 from 'gl-vec3';
import { BaseSocket, MPSocket, ProxySocket } from '../../socket';

import { setTab } from '../../gui/tab';
import {
	IChatMessage,
	ILoginRequest,
	ILoginSuccess,
	IPlayerEntity,
	IPlayerInventory,
	IPlayerKick,
	IPlayerSlotUpdate,
	IPlayerTeleport,
	IWorldBlockUpdate,
	IWorldChunkLoad,
	IWorldChunkUnload,
	IEnvironmentFogUpdate,
	IEnvironmentSkyUpdate,
	IWorldMultiBlockUpdate,
	IEntityNameUpdate,
	IPlayerUpdateMovement,
	IPlayerUpdatePhysics,
	IPlayerApplyImpulse,
	IEntityCreate,
	IEntityRemove,
	IEntityMove,
	IEntityHeldItem,
	IEntityArmor,
	ISoundPlay,
	ILoginStatus,
	IPlayerSetBlockReach,
	IUpdateTextBoard,
	UpdateTextBoard,
	IWorldChunksRemoveAll,
	IWorldChunkIsLoaded,
	IPlayerOpenInventory,
	PlayerOpenInventory,
	IRegistryUpdate,
} from 'voxelsrv-protocol/js/server';
import { Engine as BabylonEngine, Scene } from '@babylonjs/core';
import { setAssetServer } from '../helpers/assets';
import { openCrafting } from '../../gui/ingame/inventory/crafting';
import { showMobileControls } from '../../gui/mobile';
import { PopupGUI } from '../../gui/parts/miniPopupHelper';
import { getScreen } from '../../gui/main';
import { addToast, toastColors } from '../../gui/parts/toastMessage';
import { ProxyHandler } from './proxyHandler';
import { Engine } from 'noa-engine';

export let socket: BaseSocket | null = null;
let chunkInterval: any = null;
let entityEvent: Function | null = null;
let moveEvent: Function | null = null;

export function socketSend(type, data) {
	if (socket != undefined) socket.send(type, data);
}

export function isSingleplayer() {
	return socket != undefined && socket.singleplayer;
}

let noa: Engine;
let entityList = {};
let connectionScreen = null;

export function disconnect(menu: boolean = true): boolean {
	socket.close(0);
	stopListening(noa);
	if (connectionScreen != null) {
		connectionScreen.dispose();
	}
	noa.ents.getPhysics(noa.playerEntity).body.airDrag = 9999;
	noa.ents.getState(noa.playerEntity, 'model')?.main?.dispose();
	Object.values(entityList).forEach((x) => {
		noa.ents.deleteEntity(x, true);
	});
	entityList = {};
	destroyGuis();
	if (isMobile) {
		showMobileControls(false);
	}
	updateServerSettings({ ingame: false });
	document.exitPointerLock();

	if (socket.singleplayer) {
		socket.send('SingleplayerLeave', {});
		const savingWorld = new PopupGUI([{ text: '' }]);
		savingWorld.setCenterText([{ text: 'Saving world...' }]);

		getScreen(2).addControl(savingWorld.main);

		socket.on('ServerStoppingDone', () => {
			console.log('World Saved!');
			socket.close();
			savingWorld.dispose();
			buildMainMenu(noa);
		});
		return false;
	} else {
		if (menu) buildMainMenu(noa);
		return !menu;
	}
}

export async function connect(noa, server: string) {
	try {
		let socket: BaseSocket;
		let data: IServerInfo;

		data = (await getServerList())[server.replace('*', '')];

		if (data == undefined) {
			data = {
				name: 'Multiplayer server',
				ip: server,
				rawIP: server,
				motd: '',
				protocol: gameProtocol,
				software: 'VoxelSrv',
				featured: false,
				icon: 'voxelsrv',
				type: 0,
				players: {
					max: 0,
					online: 0,
				},
				useProxy: false,
				useProxyProtocol: server[0] == '*',
				auth: false,
			};
		}

		if (server[0] == '*') {
			if (!(server.startsWith('*wss://') || server.startsWith('*ws://'))) {
				socket = new ProxySocket(data.useProxy ? proxyServer : 'ws://' + server.slice(1), new ProxyHandler(server.slice(1)));
			} else {
				socket = new ProxySocket(
					data.useProxy ? proxyServer : server.slice(1),
					new ProxyHandler(server.replace('*wss://', '').replace('*ws://', ''))
				);
			}
		} else if (!(server.startsWith('wss://') || server.startsWith('ws://'))) {
			socket = new MPSocket('ws://' + server);
		} else {
			socket = new MPSocket(server);
		}

		setupConnection(noa, socket, data);
	} catch (e) {
		addToast([{ text: e.name }], [{ text: e.message }], toastColors.error, 5);
	}
}

export function setupConnection(noax, socketx: BaseSocket, serverInfo: IServerInfo) {
	if (socketx.singleplayer) {
		document.title = 'VoxelSrv - Loading world...';
	} else {
		document.title = 'VoxelSrv - Connecting to server...';
	}
	socketx.noa = noax;
	noa = noax;
	const engine: BabylonEngine = noa.rendering.getScene().getEngine();
	noa.worldName = 'World' + Math.round(Math.random() * 1000);
	socket = socketx;
	console.log('Username: ' + gameSettings.nickname, 'Server/World: ' + socket.server || socket.world);
	let firstLogin = true;
	entityList = {};

	if (holder != null) holder.dispose();

	const connScreen = new PopupGUI([{ text: !!serverInfo.name ? serverInfo.name : socket.server }]);
	connectionScreen = connScreen;
	if (!socket.singleplayer) {
		connScreen.setSubtitle([{ text: !!serverInfo.motd ? serverInfo.motd : 'Unknown server' }]);
		connScreen.setCenterText([{ text: 'Logging in...' }]);

		connScreen.createItem('Disconnect', () => {
			disconnect();
		});
	} else {
		connScreen.setSubtitle([{ text: socket.world }]);
		connScreen.setCenterText([{ text: 'Loading world...' }]);
	}

	getScreen(2).addControl(connScreen.main);

	socket.on('PlayerKick', (data: IPlayerKick) => {
		console.log(`You has been kicked from server \nReason: ${data.reason}`);
		const x = disconnect(false);
		if (x) {
			document.title = 'VoxelSrv - Disconnected!';

			const disc = new PopupGUI([{ text: socket.singleplayer ? '' : 'Disconnected!' }]);

			disc.setCenterText([{ text: data.reason }]);
			if (!socket.singleplayer) {
				disc.createItem('Reconnect', () => {
					disc.dispose();
					connect(noa, (socket instanceof ProxySocket ? '*' : '') + socket.server);
				});
			}
			disc.createItem('Main menu', () => {
				disc.dispose();
				buildMainMenu(noa);
			});

			getScreen(2).addControl(disc.main);

			document.exitPointerLock();
		}
		return;
	});

	socket.on('LoginStatus', (status: ILoginStatus) => {
		if (status.message) {
			connScreen.main.isVisible = true;
			noa.ents.getPhysics(noa.playerEntity).body.airDrag = 9999;
			connScreen.setCenterText([{ text: status.message }]);
		}
	});

	socket.on('LoginRequest', async (dataLogin: ILoginRequest) => {
		noa.worldName = `World-${Math.random() * 10000}`;
		noa.camera.heading = 0;
		noa.camera.pitch = 0;
		clearStorage();
		noa.world._chunksKnown.forEach((loc) => {
			noa.world.manuallyUnloadChunk(loc[0] * 32, loc[1] * 32, loc[2] * 32);
		});

		const scene: Scene = noa.rendering.getScene();

		const storedAuth = getAuthInfo();

		let auth = '';
		let uuid = gameSettings.nickname.toLowerCase();
		let username = storedAuth?.username || gameSettings.nickname;

		if (dataLogin.auth) {
			try {
				if (gameSettings.debugSettings.printAuthToConsole) {
					console.log('Auth: Requesting token');
				}

				const response = await (
					await fetch(heartbeatServer + '/api/createToken', {
						method: 'post',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							serverSecret: dataLogin.secret,
							loginToken: getAuthInfo()?.token,
						}),
					})
				).json();

				if (gameSettings.debugSettings.printAuthToConsole) {
					console.log('Auth: Response!', response);
				}

				if (!response.error) {
					auth = response.token;
					uuid = response.uuid;
					username = response.username;
				}
			} catch (e) {
				if (gameSettings.debugSettings.printAuthToConsole) {
					console.log('Auth: Error!');
				}
				console.error(e);
			}
		} else if (storedAuth != null) {
			uuid = storedAuth.uuid;
			username = storedAuth.username;
		}

		setAssetServer(socket.server);

		socket.send('LoginResponse', {
			username: username,
			protocol: gameProtocol,
			mobile: isMobile,
			client: `VoxelSrv ${gameVersion}`,
			uuid: uuid,
			secret: auth,
		});

		let entityIgnore: string = '';

		socket.on('PlayerEntity', (data: IPlayerEntity) => {
			console.log('Ignoring player-entity: ' + data.uuid);
			entityIgnore = data.uuid;
			if (entityList[data.uuid] != undefined && noa != undefined) noa.ents.deleteEntity(entityList[data.uuid]);
			delete entityList[data.uuid];
			applyModel(noa.playerEntity, data.uuid, data.model || 'player', data.texture || 'skins:' + uuid, 1.85, false, '', [0, 0, 0]);
		});

		scene.fogMode = defaultValues.fogMode;
		scene.fogStart = defaultValues.fogStart;
		scene.fogEnd = defaultValues.fogEnd;
		scene.fogDensity = defaultValues.fogDensity;
		scene.fogColor = new BABYLON.Color3(...defaultValues.fogColor);
		noa.blockTestDistance = defaultValues.blockTestDistance;

		scene.cameras[0].fov = (gameSettings.fov * Math.PI) / 180;

		scene.clearColor = new BABYLON.Color4(...defaultValues.clearColor, 1);
		cloudMesh.isVisible = true;

		if (!firstLogin) return;

		socket.on('LoginSuccess', (dataPlayer: ILoginSuccess) => {
			noa.ents.getPhysics(noa.playerEntity).body.airDrag = 9999;
			connScreen.main.isVisible = false;

			updateServerSettings({ ingame: true });

			if (socket.singleplayer) {
				document.title = `VoxelSrv - Playing on singleplayer world`;
			} else {
				document.title = `VoxelSrv - Playing on ${socket.server}`;
			}
			registerBlocks(noa, JSON.parse(dataPlayer.blocksDef));
			registerItems(noa, JSON.parse(dataPlayer.itemsDef));

			setupPlayerEntity(noa, JSON.parse(dataPlayer.inventory), JSON.parse(dataPlayer.armor), JSON.parse(dataPlayer.movement));

			cloudMesh.dispose();
			setupClouds(noa);
			skyMesh.dispose();
			setupSky(noa);

			noa.ents.setPosition(noa.playerEntity, dataPlayer.xPos, dataPlayer.yPos, dataPlayer.zPos);

			let checker = setInterval(() => {
				if (noa.world.playerChunkLoaded) {
					noa.ents.getPhysics(noa.playerEntity).body.airDrag = -1;
					clearInterval(checker);
				}
			}, 1);

			if (!firstLogin) return;
			firstLogin = false;

			destroyGuis();
			clearStorage();

			setupGuis(noa, socket, dataPlayer, dataLogin);

			if (isMobile) {
				showMobileControls(false);
			}

			socket.on('RegistryUpdate', (data: IRegistryUpdate) => {
				registerBlocks(noa, JSON.parse(data.blocksDef));
				registerItems(noa, JSON.parse(data.itemsDef));
			});

			socket.on('WorldChunkLoad', (data: IWorldChunkLoad) => {
				setChunk(data);
			});

			socket.on('WorldChunkUnload', (data: IWorldChunkUnload) => {
				const height = data.height > 0 ? data.height : 1;
				for (let x = 0; x <= height; x++) removeChunk(`${data.x}|${data.y + x}|${data.z}`);
			});

			socket.on('WorldChunksRemoveAll', (data: IWorldChunksRemoveAll) => {
				if (data.confirm) clearStorage();
			});

			socket.on('WorldChunkIsLoaded', (data: IWorldChunkIsLoaded) => {
				socket.send('WorldChunkIsLoadedResponce', { x: data.x, y: data.y, z: data.z, loaded: chunkExist([data.x, data.y, data.z].join('|')) });
			});

			socket.on('WorldMultiBlockUpdate', (data: IWorldMultiBlockUpdate) => {
				Object.values(data.blocks).forEach((block) => {
					noa.setBlock(block.id, block.x, block.y, block.z);
					chunkSetBlock(block.id, block.x, block.y, block.z, 100);
				});
			});

			socket.on('WorldBlockUpdate', (data: IWorldBlockUpdate) => {
				noa.setBlock(data.id, data.x, data.y, data.z);
				chunkSetBlock(data.id, data.x, data.y, data.z, 100);
			});

			socket.on('EnvironmentFogUpdate', (data: IEnvironmentFogUpdate) => {
				if (data.mode != undefined) scene.fogMode = data.mode;
				if (data.start != undefined) scene.fogStart = data.start;
				if (data.end != undefined) scene.fogEnd = data.end;
				if (data.density != undefined) scene.fogDensity = data.density;
				if ((data.colorRed != undefined, data.colorGreen != undefined, data.colorBlue != undefined))
					scene.fogColor = new BABYLON.Color3(data.colorRed, data.colorGreen, data.colorBlue);
			});

			socket.on('EnvironmentSkyUpdate', (data: IEnvironmentSkyUpdate) => {
				if ((data.colorRed != undefined, data.colorGreen != undefined, data.colorBlue != undefined))
					scene.clearColor = new BABYLON.Color4(data.colorRed, data.colorGreen, data.colorBlue, 1);
				if ((data.colorRedTop != undefined, data.colorGreenTop != undefined, data.colorBlueTop != undefined))
					// @ts-ignore
					skyMesh.material.emissiveColor = new BABYLON.Color3(data.colorRedTop, data.colorGreenTop, data.colorBlueTop);
				// @ts-ignore
				skyMesh.material.diffuseColor = skyMesh.material.emissiveColor;
				if (data.clouds != undefined) cloudMesh.isVisible = data.clouds;
			});

			socket.on('PlayerInventory', function (data: IPlayerInventory) {
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

			socket.on('PlayerSlotUpdate', function (data: IPlayerSlotUpdate) {
				const item = JSON.parse(data.data);
				const inv = noa.ents.getState(noa.playerEntity, 'inventory');

				if (data.type == 'temp') inv.tempslot = item;
				else if (data.type == 'main') inv.items[data.slot] = item;
				else if (data.type == 'armor') inv.armor.items[data.slot] = item;
				else if (data.type == 'crafting') inv.crafting[data.slot] = item;
				else if (data.type == 'hook') inv.hook.items[data.slot] = item;
			});

			socket.on('PlayerSetBlockReach', (data: IPlayerSetBlockReach) => {
				noa.blockTestDistance = data.value;
			});

			socket.on('PlayerOpenInventory', (data: IPlayerOpenInventory) => {
				if (data.type == PlayerOpenInventory.Type.MAIN) noa.inputs.down.emit('inventory');
				else if (data.type == PlayerOpenInventory.Type.CRAFTING) {
					const inv = JSON.parse(data.data);

					noa.ents.getState(noa.playerEntity, 'inventory').hook = inv;

					openCrafting(noa, socket);
				}
			});

			socket.on('ChatMessage', (data: IChatMessage) => {
				addMessage(data.message);
			});

			socket.on('UpdateTextBoard', (data: IUpdateTextBoard) => {
				if (data.type == UpdateTextBoard.Type.TAB) setTab(data.message);
			});

			socket.on('PlayerTeleport', function (data: IPlayerTeleport) {
				noa.ents.setPosition(noa.playerEntity, data.x, data.y, data.z);
			});

			socket.on('PlayerUpdateMovement', (data: IPlayerUpdateMovement) => {
				const move = noa.ents.getMovement(noa.playerEntity);
				move[data.key] = data.value;
			});

			socket.on('PlayerUpdatePhysics', (data: IPlayerUpdatePhysics) => {
				const move = noa.ents.getPhysicsBody(noa.playerEntity);
				move[data.key] = data.value;
			});

			socket.on('PlayerApplyImpulse', (data: IPlayerApplyImpulse) => {
				noa.ents.getPhysicsBody(noa.playerEntity).applyImpulse([data.x, data.y, data.z]);
			});

			socket.on('EntityCreate', async (data: IEntityCreate) => {
				if (entityIgnore != data.uuid) {
					const entData = JSON.parse(data.data);
					entityList[data.uuid] = noa.ents.add(Object.values(entData.position), 1, 2, null, null, false, true);
					applyModel(entityList[data.uuid], data.uuid, entData.model, entData.texture, entData.offset, entData.nametag, entData.name, entData.hitbox);
					noa.ents.getState(entityList[data.uuid], 'position').newPosition = noa.ents.getState(entityList[data.uuid], 'position').position;
				}
			});

			socket.on('EntityNameUpdate', (data: IEntityNameUpdate) => {
				const model = noa.ents.getState(entityList[data.uuid], 'model');
				model.nametag.dispose();
				model.nametag = addNametag(model.main, data.name, noa.ents.getPositionData(entityList[data.uuid]).height, data.visible);
			});

			socket.on('EntityRemove', (data: IEntityRemove) => {
				if (entityList[data.uuid] != undefined) noa.ents.deleteEntity(entityList[data.uuid]);
				delete entityList[data.uuid];
			});

			socket.on('EntityMove', (data: IEntityMove) => {
				if (entityList[data.uuid] != undefined) {
					var pos = [data.x, data.y, data.z];
					noa.ents.getState(entityList[data.uuid], 'position').newPosition = pos;
					noa.ents.getState(entityList[data.uuid], 'position').rotation = data.rotation * 2;
					noa.ents.getState(entityList[data.uuid], 'position').pitch = data.pitch * 2;
				}
			});

			socket.on('EntityHeldItem', (data: IEntityHeldItem) => {});
			socket.on('EntityArmor', (data: IEntityArmor) => {});

			socket.on('SoundPlay', (data: ISoundPlay) => {
				playSound(data.sound, data.volume, data.x != undefined ? [data.x, data.y, data.z] : null, noa);
			});

			const pos = noa.ents.getState(noa.playerEntity, 'position');
			let lastPos = [];
			let lastRot = 0;
			let lastPitch = 0;

			let ping = 0;
			let h5rge = 0;

			moveEvent = () => {
				if (h5rge == 0) {
					const rot = noa.camera.heading;
					const pitch = noa.camera.pitch;
					if (vec3.dist(lastPos, pos.position) > 0.15 || lastRot != rot || lastPitch != pitch) {
						lastPos = [...pos.position];
						lastPitch = pitch;
						lastRot = rot;
						socket.send('ActionMoveLook', { x: pos.position[0], y: pos.position[1], z: pos.position[2], rotation: rot, pitch: pitch });
					} else if (vec3.dist(lastPos, pos.position) > 0.15) {
						lastPos = [...pos.position];
						socket.send('ActionMove', { x: pos.position[0], y: pos.position[1], z: pos.position[2] });
					} else if (lastRot != rot || lastPitch != pitch) {
						lastPitch = pitch;
						lastRot = rot;
						socket.send('ActionLook', { rotation: rot, pitch: pitch });
					}
					h5rge = 2;
				}

				h5rge = h5rge - 1;

				ping = ping + 1;

				if (ping >= 120) {
					socket.send('Ping', { time: Date.now() });
					ping = 0;
				}
			};

			noa.on('tick', moveEvent);

			entityEvent = async function () {
				const playerModel = noa.ents.getState(noa.playerEntity, 'model');
				const playerPos = noa.ents.getState(noa.playerEntity, 'position');

				if (playerModel != undefined) {
					const value = noa.camera.zoomDistance != 0;
					playerModel.main.visibility = value;
					var children = playerModel.main.getChildMeshes(false);

					let i;
					for (i = 0; i < children.length; i++) {
						children[i].visibility = value;
					}

					if (value) {
						updateAnimationOfModel(playerModel, playerPos, noa.camera.getTargetPosition(), playerModel.main);
						playerModel.main.rotation.y = noa.camera.heading;
						playerModel.models.head.rotation.x = noa.camera.pitch;

					}
				}

				Object.values(entityList).forEach(async function (id: number) {
					const pos = noa.ents.getState(id, 'position');
					const newPos = pos.newPosition;
					const mainMesh = noa.ents.getState(id, 'mesh');
					const model = noa.ents.getState(id, 'model');
					if (mainMesh != undefined && newPos != undefined && pos.position != undefined) {
						let move = vec3.create();
						vec3.lerp(move, pos.position, newPos, 12 / engine.getFps());
						noa.ents.setPosition(id, move[0], move[1], move[2]);
						updateAnimationOfModel(model, pos, newPos, mainMesh.mesh);
					}
				});
			};

			function updateAnimationOfModel(model, pos, newPos, mainMesh) {
				const posx = pos.position;

				let move = vec3.create();
				vec3.lerp(move, posx, newPos, 12 / engine.getFps());
				const rot = pos.rotation ? pos.rotation : 0;
				const pitch = pos.pitch ? pos.pitch : 0;
				const pos2da = [newPos[0], 0, newPos[2]];
				const pos2db = [posx[0], 0, posx[2]];

				if (model.x == undefined) {
					model.x = 0;
					model.y = 0;
					model.z = false;
				}

				let sin = Math.sin(model.x);
				if (vec3.dist(pos2da, pos2db) > 0.05) {
					model.y = vec3.dist(pos2da, pos2db) / 5;
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

				if (!mainMesh.rotation.y) mainMesh.rotation.y = 0;

				const oldRot = mainMesh.rotation.y;

				if (rot / 2 - oldRot > 5) mainMesh.rotation.y = rot / 2;
				else mainMesh.rotation.y = (rot / 2 + oldRot) / 2;

				model.models.head.rotation.x = pitch / 2;

				if (model.nametag != undefined) {
					model.nametag.rotation.y = noa.camera.heading - mainMesh.rotation.y;
					model.nametag.rotation.x = noa.camera.pitch;
				}
			}

			noa.on('beforeRender', entityEvent);
		});
	});
}

export function stopListening(noa) {
	if (moveEvent != null) noa.off('tick', moveEvent);
	if (moveEvent != null) noa.off('beforeRender', entityEvent);
	if (chunkInterval != null) clearInterval(chunkInterval);
}
