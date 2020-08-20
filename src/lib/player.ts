import { setupGamepad } from './gamepad';
import { isMobile } from 'mobile-device-detect';
import { gameSettings } from '../values';
import { blockIDmap, blockIDs, blocks } from './registry';
import { inventory } from '../gui/inventory';

const screenshot = require('canvas-screenshot');

export function setupControls(noa: any, socket: any) {
	const eid = noa.playerEntity;
	const scene = noa.rendering.getScene();

	noa.container.canvas.requestPointerLock();

	noa.container.canvas.addEventListener('click', () => {
		if (inventory.isVisible) return;
		else noa.container.canvas.requestPointerLock();
	});

	function inventoryHasItem(item: string, count: number) {
		const inventory = noa.ents.getState(eid, 'inventory');
		const items: Array<any> = Object.entries(inventory.items);

		for (let x = 0; x < items.length; x++) {
			if (items[x] != null && items[x][1].id == item && items[x][1].count >= count) return parseInt(items[x][0]);
		}
		return -1;
	}

	noa.blockTargetIdCheck = function (id) {
		if (blockIDmap[id] != undefined) {
			if (blocks[blockIDmap[id]].options.fluid == true) return false;
			return true;
		} else return false;
	};

	noa.inputs.preventDefaults = true;

	// on left mouse, set targeted block to be air
	noa.inputs.down.on('fire', function () {
		if (noa.targetedBlock) {
			//startBreakingBlock(noa.targetedBlock.position, noa.targetedBlock.blockID)
			const pos = noa.targetedBlock.position;
			socket.send('actionBlockBreak', { x: pos[0], y: pos[1], z: pos[2] });
		}
	});

	noa.inputs.up.on('fire', function () {
		//stopBreakingBlock()
	});

	// place block on alt-fire (RMB/E)
	noa.inputs.down.on('alt-fire', function () {
		if (noa.targetedBlock != undefined) {
			const pos = noa.targetedBlock.adjacent;
			const pos2 = noa.targetedBlock.position;
			if (noa.ents.isTerrainBlocked(pos[0], pos[1], pos[2]) == false) {
				socket.send('actionBlockPlace', { x: pos[0], y: pos[1], z: pos[2], x2: pos2[0], y2: pos2[1], z2: pos2[2] });
			}
		}
	});

	// pick block on middle fire (MMB/Q)
	noa.inputs.down.on('mid-fire', function () {
		if (noa.targetedBlock && noa.targetedBlock.blockID != 0) {
			const item = blocks[blockIDmap[noa.targetedBlock.blockID]].id;
			const slot = inventoryHasItem(item, 1);
			const sel = noa.ents.getState(eid, 'inventory').selected;
			if (slot != -1 && slot < 9) {
				socket.send('actionInventoryClick', { type: 'select', slot: slot });
				noa.ents.getState(eid, 'inventory').selected = slot;
			} else if (slot != -1) socket.send('actionInventoryClick', { type: 'switch', slot: slot, slot2: sel });
		}
	});

	// 3rd person view
	noa.inputs.down.on('thirdprsn', function () {
		if (document.pointerLockElement == noa.container.canvas) {
		}
	});

	// Inventory
	noa.inputs.down.on('inventory', function () {
		if (inventory.isVisible == true) {
			inventory.isVisible = false;
			noa.container.canvas.requestPointerLock();
		} else {
			inventory.isVisible = true;
			document.exitPointerLock();
		}
	});

	noa.inputs.down.on('chat', function () {});

	let pause = false;
	noa.inputs.down.on('menu', (e) => {});

	document.addEventListener(
		'pointerlockchange',
		function () {
			if (document.pointerLockElement == noa.container.canvas) {
			}
		},
		false
	);

	noa.inputs.down.on('chatenter', function () {});

	noa.inputs.down.on('tab', function () {});

	noa.inputs.up.on('tab', function () {});

	noa.inputs.up.on('screenshot', function () {
		if (document.pointerLockElement == noa.container.canvas) {
			screenshot(noa.container.canvas, { filename: 'VoxelSRV-' + Date.now() + '.png' });
		}
	});

	// each tick, consume any scroll events and use them to zoom camera
	noa.on('tick', async function () {
		const scroll = noa.inputs.state.scrolly;
		if (scroll !== 0) {
			let pickedID = noa.ents.getState(eid, 'inventory').selected;
			const change = scroll > 0 ? 1 : -1;
			pickedID = pickedID + change;
			if (pickedID >= gameSettings.hotbarsize) pickedID = 0;
			else if (pickedID < 0) pickedID = 8;
			socket.send('actionInventoryClick', { slot: pickedID, type: 'select' });
			noa.ents.getState(noa.playerEntity, 'inventory').selected = pickedID;
		}
	});

	noa.inputs.bind('numberkey', '1', '2', '3', '4', '5', '6', '7', '8', '9');
	noa.inputs.down.on('numberkey', (e) => {
		if (document.pointerLockElement == noa.container.canvas) {
			const num = parseInt(e.key);
			let pickedID = noa.ents.getState(eid, 'inventory').selected;
			pickedID = num - 1;
			socket.send('actionInventoryClick', { slot: pickedID, type: 'select' });
			noa.ents.getState(noa.playerEntity, 'inventory').selected = pickedID;
		}
	});

	// Tempfix

	noa.on('tick', async () => {
		if (document.pointerLockElement != noa.container.canvas && !isMobile) {
			noa.ents.getState(noa.playerEntity, 'receivesInputs').ignore = true;
		} else {
			noa.ents.getState(noa.playerEntity, 'receivesInputs').ignore = false;
		}
	});

	if (localStorage.getItem('gamepad') == 'true') setupGamepad(noa);
}

export function setupPlayer(noa: any, invData: Object, arrData: Object,) {
	const eid = noa.playerEntity;
	const dat = noa.entities.getPositionData(eid);

	const scene = noa.rendering.getScene();

	const w = dat.width;
	const h = dat.height;

	const eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height;

	const offset = [0, h / 2, 0];

	noa.rendering.getScene().cameras[0].fov = 1;

	// Gamemode and players settings

	const move = noa.entities.getMovement(eid);

	move.jumpForce = 6;
	move.jumpImpulse = 8.5;
	move.maxSpeed = 7.5;

	// Create inventory, move it to global entities js in future
	noa.ents.createComponent({
		name: 'inventory',
		state: { items: {}, selected: 0, tempslot: {}, armor:{} },
	});
	if (invData != undefined) noa.ents.addComponent(eid, 'inventory', invData);
	if (arrData != undefined) noa.ents.getState(eid, 'inventory').armor =  arrData;



	noa.entities.addComponent(eid, noa.entities.names.mesh, {
		mesh: new BABYLON.Mesh('main', scene),
		offset: offset,
	});
}
