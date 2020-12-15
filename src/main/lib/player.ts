import * as BABYLON from '@babylonjs/core/Legacy/legacy';

import { isMobile } from 'mobile-device-detect';
import { gameSettings, serverSettings } from '../values';
import { blockIDmap, blocks } from './registry';
import { hotbar, inventory } from '../gui/inventory';
import { input as chatInput, changeState as chanceChatState, chatContainer } from '../gui/chat';
import { socketSend } from './connect';
import { getUI } from '../gui/main';
import { pauseScreen } from '../gui/pause';
import { tabContainer } from '../gui/tab';
import { debug, dot } from '../gui/debug';

const screenshot = require('canvas-screenshot');

export function setupControls(noa: any) {
	const eid = noa.playerEntity;
	const scene = noa.rendering.getScene();
	const ui = getUI(1);

	noa.container.canvas.requestPointerLock();

	noa.container.canvas.addEventListener('click', () => {
		if (!serverSettings.ingame) return;
		if (inventory.isVisible || chatInput.isVisible || pauseScreen.isVisible) return;

		noa.container.canvas.requestPointerLock();

		chatInput.isVisible = false;
		chatInput.text = '';
	});

	function inventoryHasItem(item: string, count: number) {
		const inventory = noa.ents.getState(eid, 'inventory');
		const items: Array<any> = Object.entries(inventory.items);

		for (let x = 0; x < items.length; x++) {
			if (items[x] != null && items[x][1] != null && items[x][1].id == item && items[x][1].count >= count) return parseInt(items[x][0]);
		}
		return -1;
	}

	function castRay() {
		let ray = scene.createPickingRay(
			window.innerWidth / 2,
			window.innerHeight / 2,
			BABYLON.Matrix.Identity(),
			noa.rendering.getScene().activeCameras[0]
		);

		const hit = scene.pickWithRay(
			ray,
			(mesh) => {
				return mesh.name.startsWith('hitbox-');
			},
			true
		);

		if (hit.pickedMesh) {
			return [hit.pickedMesh.name.substring(7), hit.distance];
		} else return null;
	}

	noa.blockTargetIdCheck = function (id: number) {
		if (blockIDmap[id] != undefined && id != 0 && blocks[blockIDmap[id]] != undefined) {
			if (blocks[blockIDmap[id]].options.fluid == true) return false;
			return true;
		} else return false;
	};

	// on left mouse, set targeted block to be air
	noa.inputs.down.on('fire', async function () {
		if (!serverSettings.ingame) return;

		const entClick = castRay();
		if (!!entClick) {
			socketSend('ActionClickEntity', { type: 'left', uuid: entClick[0], distance: entClick[1] });
			socketSend('ActionClick', { type: 'left', x: 0, y: 0, z: 0, onBlock: false });
			return;
		}
		if (noa.targetedBlock) {
			//startBreakingBlock(noa.targetedBlock.position, noa.targetedBlock.blockID)
			const pos = noa.targetedBlock.position;
			socketSend('ActionClick', { type: 'left', x: pos[0], y: pos[1], z: pos[2], onBlock: true });
			socketSend('ActionBlockBreak', { x: pos[0], y: pos[1], z: pos[2], finished: true });
			return;
		} else socketSend('ActionClick', { type: 'left', x: 0, y: 0, z: 0, onBlock: false });
	});

	noa.inputs.up.on('fire', function () {
		if (!serverSettings.ingame) return;
		//stopBreakingBlock()
	});

	// place block on alt-fire (RMB/E)
	noa.inputs.down.on('alt-fire', function () {
		if (!serverSettings.ingame) return;
		const entClick = castRay();
		if (!!entClick) {
			socketSend('ActionClickEntity', { type: 'right', uuid: entClick[0], distance: entClick[1] });
			socketSend('ActionClick', { type: 'right', x: 0, y: 0, z: 0, onBlock: false });
			return;
		}

		if (noa.targetedBlock != undefined) {
			const pos = noa.targetedBlock.adjacent;
			const pos2 = noa.targetedBlock.position;
			socketSend('ActionClick', { type: 'right', x: pos2[0], y: pos2[1], z: pos2[2], onBlock: true });
			if (noa.ents.isTerrainBlocked(pos[0], pos[1], pos[2]) == false) {
				socketSend('ActionBlockPlace', { x: pos[0], y: pos[1], z: pos[2], x2: pos2[0], y2: pos2[1], z2: pos2[2] });
			}
			return;
		} else socketSend('ActionClick', { type: 'right', x: 0, y: 0, z: 0, onBlock: false });

		
	});

	// pick block on middle fire (MMB/Q)
	noa.inputs.down.on('mid-fire', function () {
		if (!serverSettings.ingame) return;
		if (noa.targetedBlock && noa.targetedBlock.blockID != 0) {
			const item = blocks[blockIDmap[noa.targetedBlock.blockID]].id;
			const slot = inventoryHasItem(item, 1);
			const sel = noa.ents.getState(eid, 'inventory').selected;
			if (slot != -1 && slot < 9) {
				socketSend('ActionInventoryClick', { type: 'select', slot: slot });
				noa.ents.getState(eid, 'inventory').selected = slot;
			} else if (slot != -1) socketSend('ActionInventoryClick', { type: 'switch', slot: slot, slot2: sel });
		}
	});

	// 3rd person view
	noa.inputs.down.on('thirdprsn', function () {
		if (!serverSettings.ingame) return;
		if (document.pointerLockElement == noa.container.canvas) {
		}
	});

	// Inventory
	noa.inputs.down.on('inventory', function () {
		if (!serverSettings.ingame) return;
		if (chatInput.isVisible || pauseScreen.isVisible) return;
		if (inventory.isVisible) {
			inventory.isVisible = false;
			noa.container.canvas.requestPointerLock();
			socketSend('ActionInventoryClose', { inventory: 'main' });
		} else {
			socketSend('ActionInventoryOpen', { inventory: 'main' });
			inventory.isVisible = true;
			document.exitPointerLock();
		}
	});

	noa.inputs.down.on('chat', function () {
		if (!serverSettings.ingame) return;
		if (inventory.isVisible || chatInput.isVisible || pauseScreen.isVisible) return;
		chatInput.isVisible = true;
		chanceChatState(true);
		document.exitPointerLock();
		ui.moveFocusToControl(chatInput);
		chatInput.text = '';
	});

	noa.inputs.down.on('cmd', function () {
		if (!serverSettings.ingame) return;
		if (inventory.isVisible || chatInput.isVisible || pauseScreen.isVisible) return;
		chatInput.isVisible = true;
		chanceChatState(true);
		document.exitPointerLock();
		ui.moveFocusToControl(chatInput);
		chatInput.text = '/';
	});

	let pause = false;
	noa.inputs.down.on('menu', (e) => {
		if (!serverSettings.ingame) return;

		if (chatInput.isVisible) {
			chatInput.isVisible = false;
			chatInput.text = '';
			chanceChatState(false);
			return;
		}

		if (inventory.isVisible) {
			inventory.isVisible = false;
			socketSend('ActionInventoryClose', { inventory: 'main' });
			return;
		}

		if (pauseScreen.isVisible) {
			pauseScreen.isVisible = false;
			return;
		} else {
			document.exitPointerLock();
			pauseScreen.isVisible = true;
			return;
		}
	});

	noa.inputs.down.on('chatenter', function () {
		if (!serverSettings.ingame) return;
		chatInput.isVisible = false;
		socketSend('ActionMessage', { message: chatInput.text });
		chatInput.text = '';
		chanceChatState(false);
	});

	noa.inputs.down.on('tab', function () {
		if (chatInput == undefined || chatInput.isVisible) return;

		tabContainer.isVisible = true;
	});

	noa.inputs.up.on('tab', function () {
		if (chatInput == undefined || chatInput.isVisible) return;

		tabContainer.isVisible = false;
	});

	noa.inputs.down.on('zoom', function () {
		if (chatInput == undefined || chatInput.isVisible) return;

		scene.cameras[0].fov = 0.4;
	});

	noa.inputs.up.on('zoom', function () {
		if (chatInput == undefined || chatInput.isVisible) return;

		scene.cameras[0].fov = gameSettings.fov * Math.PI / 180;
	});


	noa.inputs.up.on('screenshot', function () {
		if (chatInput == undefined || chatInput.isVisible) return;
		if (document.pointerLockElement == noa.container.canvas) {
			screenshot(noa.container.canvas, { filename: 'VoxelSRV-' + Date.now() + '.png' });
		}
	});

	let hidden = false;

	noa.inputs.up.on('hide', function () {
		if (chatInput == undefined || chatInput.isVisible) return;
		hidden = !hidden;

		hotbar.isVisible = !hidden;
		debug.isVisible = !hidden;
		dot.isVisible = !hidden;
	});

	// each tick, consume any scroll events and use them to zoom camera
	noa.on('tick', async function () {
		if (!serverSettings.ingame) return;
		const scroll = noa.inputs.state.scrolly;
		if (scroll !== 0) {
			let pickedID = noa.ents.getState(eid, 'inventory').selected;
			const change = scroll > 0 ? 1 : -1;
			pickedID = pickedID + change;
			if (pickedID >= gameSettings.hotbarsize) pickedID = 0;
			else if (pickedID < 0) pickedID = 8;
			socketSend('ActionInventoryClick', { slot: pickedID, type: 'select' });
			noa.ents.getState(eid, 'inventory').selected = pickedID;
		}

		if (noa.inputs.state.jump) {
			const pos = noa.ents.getPosition(eid);
			const block = blocks[blockIDmap[noa.getBlock(Math.floor(pos[0]), Math.floor(pos[1]), Math.floor(pos[2]))]];
			if (block != undefined && block.options.fluid == true) {
				noa.ents.getPhysicsBody(eid).applyImpulse([0, 1, 0]);
			}
		}
	});

	noa.inputs.bind('numberkey', '1', '2', '3', '4', '5', '6', '7', '8', '9');
	noa.inputs.down.on('numberkey', (e) => {
		if (!serverSettings.ingame) return;
		if (document.pointerLockElement == noa.container.canvas) {
			const num = parseInt(e.key);
			let pickedID = noa.ents.getState(eid, 'inventory').selected;
			pickedID = num - 1;
			socketSend('ActionInventoryClick', { slot: pickedID, type: 'select' });
			noa.ents.getState(eid, 'inventory').selected = pickedID;
		}
	});
}

export function setupPlayer(noa: any, invData: object, arrData: object, movement: object) {
	const eid = noa.playerEntity;
	const dat = noa.entities.getPositionData(eid);

	const scene = noa.rendering.getScene();

	const w = dat.width;
	const h = dat.height;

	const eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height;

	const offset = [0, h / 2, 0];

	// Gamemode and players settings

	const move = noa.entities.getMovement(eid);

	if (!!movement) {
		Object.entries(movement).forEach((s) => {
			move[s[0]] = s[1];
		});
	}

	// Create inventory, move it to global entities js in future
	if (invData != undefined) noa.ents.addComponentAgain(eid, 'inventory', invData);
	if (arrData != undefined) noa.ents.getState(eid, 'inventory').armor = arrData;

	noa.ents.getState(eid, 'inventory').crafting = { 1: {}, 2: {}, 3: {}, 4: {} };

	noa.entities.addComponentAgain(eid, noa.entities.names.mesh, {
		mesh: new BABYLON.Mesh('main', scene),
		offset: offset,
	});
}
