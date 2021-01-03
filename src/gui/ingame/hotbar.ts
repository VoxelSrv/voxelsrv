import { isMobile } from 'mobile-device-detect';
import { getScreen, scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';

import { createSlot, updateSlot } from '../parts/itemSlot';

import { inventory, openInventory } from './inventory/main';

export let hotbar: GUI.Rectangle;

export function buildHotbar(noa, socket) {
	function getInv() {
		return noa.ents.getState(noa.playerEntity, 'inventory');
	}

	const ui = getScreen(2);

	hotbar = new GUI.Rectangle();
	hotbar.zIndex = 5;
	hotbar.verticalAlignment = 1;
	hotbar.width = `${184 * scale}px`;
	hotbar.height = `${24 * scale}px`;
	hotbar.thickness = 0;
	ui.addControl(hotbar);

	const hotbarTexture = new GUI.Image('hotbar', './textures/gui/hotbar.png');
	hotbarTexture.width = `${184 * scale}px`;
	hotbarTexture.height = `${24 * scale}px`;
	hotbar.addControl(hotbarTexture);

	const hotbarSelected = new GUI.Image('hotbar', './textures/gui/selected.png');
	hotbarSelected.zIndex = 8;
	hotbarSelected.width = `${24 * scale}px`;
	hotbarSelected.height = `${24 * scale}px`;
	hotbarSelected.left = `${-19 * scale * 4}px`;
	hotbar.addControl(hotbarSelected);

	const hotbarSlots = new Array(9);

	for (let x = 0; x < 9; x++) {
		hotbarSlots[x] = createSlot(scale);
		const container = hotbarSlots[x].container;
		container.zIndex = 9;
		container.isPointerBlocker = true;
		container.left = `${-20 * scale * 4 + 20 * scale * x}px`;
		container.onPointerClickObservable.add((e) => {
			noa.ents.getState(noa.playerEntity, 'inventory').selected = x;
			socket.send('ActionInventoryClick', { slot: x, type: 'select' });
		});
		hotbar.addControl(container);
	}

	const hotbarOpen = new GUI.Image('hotbar', './textures/gui/inventoryopen.png');

	if (isMobile) {
		hotbarOpen.zIndex = 8;
		hotbarOpen.verticalAlignment = 1;
		hotbarOpen.width = `${24 * scale}px`;
		hotbarOpen.height = `${24 * scale}px`;
		hotbarOpen.left = `${19 * scale * 6}px`;
		hotbarOpen.onPointerClickObservable.add(() => {
			if (inventory == null) openInventory(noa, socket);
		});
		ui.addControl(hotbarOpen);
	}

	const update = async () => {
		const inv = getInv();
		hotbarSelected.left = `${-20 * scale * 4 + 20 * scale * inv.selected}px`;

		for (let x = 0; x < 9; x++) {
			updateSlot(hotbarSlots[x], inv.items[x]);
		}
	};

	noa.on('tick', update);

	const scaleEvent = (x) => {
		hotbar.width = `${184 * x}px`;
		hotbar.height = `${24 * x}px`;
		hotbarTexture.width = `${184 * x}px`;
		hotbarTexture.height = `${24 * x}px`;
		hotbarSelected.width = `${24 * x}px`;
		hotbarSelected.height = `${24 * x}px`;

		for (let x = 0; x < 9; x++) {
			hotbarSlots[x].container.height = `${16 * scale}px`;
			hotbarSlots[x].container.width = `${16 * scale}px`;
			hotbarSlots[x].container.left = `${-20 * scale * 4 + 20 * scale * x}px`;
			hotbarSlots[x].item.width = `${16 * scale}px`;
			hotbarSlots[x].item.height = `${16 * scale}px`;
			hotbarSlots[x].count.fontSize = `${8 * scale}px`;
			hotbarSlots[x].count.left = `${2 * scale}px`;
			hotbarSlots[x].count.top = `${4 * scale}px`;
			hotbarSlots[x].count.shadowOffsetX = scale;
			hotbarSlots[x].count.shadowOffsetY = scale;
		}

		if (isMobile) {
			hotbarOpen.width = `${24 * scale}px`;
			hotbarOpen.height = `${24 * scale}px`;
			hotbarOpen.left = `${19 * scale * 6}px`;
		}
	};

	event.on('scale-change', scaleEvent);

	hotbar.onDisposeObservable.add(() => {
		event.off('scale-change', scaleEvent);
		noa.off('tick', update);
		hotbarOpen.dispose();
	});
}
