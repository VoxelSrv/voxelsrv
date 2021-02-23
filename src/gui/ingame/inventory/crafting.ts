import { getScreen, scale, event } from '../../main';
import * as GUI from '@babylonjs/gui/';
import { ActionInventoryClick } from 'voxelsrv-protocol/js/client';

import { ItemSlot, createSlot, updateSlot } from '../../parts/itemSlot';
import { defaultValues } from '../../../values';
import { getBaseInventory } from './base';
import { Engine } from 'noa-engine';
import { BaseSocket } from '../../../socket';

export let craftingInventory: GUI.Rectangle = null;

export function openCrafting(noa: Engine, socket: BaseSocket) {
	function getInv() {
		return noa.ents.getState(noa.playerEntity, 'inventory').hook;
	}

	const ui = getScreen(2);

	craftingInventory = new GUI.Rectangle();
	craftingInventory.zIndex = 15;
	craftingInventory.verticalAlignment = 2;
	craftingInventory.background = defaultValues.backgroundColor;
	craftingInventory.thickness = 0;

	ui.addControl(craftingInventory);

	const base = getBaseInventory(noa, socket);

	base.inventory.top = `${27 * scale}px`;

	const inventoryTexture = new GUI.Image('inventory', './textures/gui/container/crafting_table.png');
	inventoryTexture.width = `${180 * scale}px`;
	inventoryTexture.height = `${176 * scale}px`;
	inventoryTexture.zIndex = 18;

	craftingInventory.addControl(inventoryTexture);

	base.inventory.zIndex = 19;

	craftingInventory.addControl(base.inventory);
	craftingInventory.addControl(base.tempslot.container);

	const craftingSlots: Array<ItemSlot> = new Array(5);

	const crafting = new GUI.Rectangle();
	crafting.zIndex = 40;
	crafting.verticalAlignment = 2;
	crafting.horizontalAlignment = 2;
	crafting.top = `${-40 * scale}px`;
	crafting.height = `${52 * scale}px`;
	crafting.width = `${160 * scale}px`;
	crafting.thickness = 0;

	craftingInventory.addControl(crafting);

	for (let x = 0; x < 10; x++) {
		craftingSlots[x] = createSlot(scale);
		const container = craftingSlots[x].container;
		container.zIndex = 50;
		container.verticalAlignment = 0;
		container.horizontalAlignment = 0;
		if (x == 9) {
			container.left = `${116 * scale}px`;
			container.top = `${18 * scale}px`;
		} else {
			if (x % 3 == 1) container.left = `${40 * scale}px`;
			else if (x % 3 == 2) container.left = `${58 * scale}px`;
			else container.left = `${22 * scale}px`;
			const y = Math.floor(x / 3);

			if (y == 1) container.top = `${18 * scale}px`;
			else if (y == 2) container.top = `${18 * 2 * scale}px`;
		}

		container.onPointerClickObservable.add((e) => {
			let click = ActionInventoryClick.Type.LEFT;
			switch (e.buttonIndex) {
				case 0:
					click = ActionInventoryClick.Type.LEFT;
					break;
				case 1:
					click = ActionInventoryClick.Type.MIDDLE;
					break;
				case 2:
					click = ActionInventoryClick.Type.RIGHT;
					break;
			}
			socket.send('ActionInventoryClick', { slot: x, type: click, inventory: ActionInventoryClick.TypeInv.HOOK });
		});
		container.onPointerEnterObservable.add((e) => {
			container.background = '#ffffff22';
		});

		container.onPointerOutObservable.add((e) => {
			container.background = '#00000000';
		});

		container.isPointerBlocker = true;
		crafting.addControl(container);
	}

	const update = async () => {
		const inv = getInv();
		for (let x = 0; x < 10; x++) {
			updateSlot(craftingSlots[x], inv.items[x]);
		}
	};

	noa.on('tick', update);

	const scaleEvent = (scale2) => {
		base.inventory.top = `${27 * scale}px`;

		inventoryTexture.width = `${180 * scale2}px`;
		inventoryTexture.height = `${176 * scale2}px`;

		crafting.top = `${-40 * scale}px`;
		crafting.height = `${52 * scale}px`;
		crafting.width = `${160 * scale}px`;

		for (let x = 0; x < 10; x++) {
			if (x == 9) {
				craftingSlots[x].container.left = `${116 * scale}px`;
				craftingSlots[x].container.top = `${18 * scale}px`;
			} else {
				if (x % 3 == 1) craftingSlots[x].container.left = `${40 * scale}px`;
				else if (x % 3 == 2) craftingSlots[x].container.left = `${58 * scale}px`;
				else craftingSlots[x].container.left = `${22 * scale}px`;
				const y = Math.floor(x / 3);

				if (y == 1) craftingSlots[x].container.top = `${18 * scale}px`;
				else if (y == 2) craftingSlots[x].container.top = `${18 * 2 * scale}px`;
			}

			craftingSlots[x].container.height = `${16 * scale2}px`;
			craftingSlots[x].container.width = `${16 * scale2}px`;
			craftingSlots[x].item.width = `${16 * scale2}px`;
			craftingSlots[x].item.height = `${16 * scale2}px`;
			craftingSlots[x].count.fontSize = `${8 * scale2}px`;
			craftingSlots[x].count.left = `${2 * scale2}px`;
			craftingSlots[x].count.top = `${4 * scale2}px`;
			craftingSlots[x].count.shadowOffsetX = scale2;
			craftingSlots[x].count.shadowOffsetY = scale2;
		}
	};

	event.on('scale-change', scaleEvent);

	craftingInventory.onDisposeObservable.add(() => {
		event.off('scale-change', scaleEvent);
		noa.off('tick', update);
	});
}

export function closeCrafting() {
	if (craftingInventory != null) craftingInventory.dispose();
	craftingInventory = null;
}
