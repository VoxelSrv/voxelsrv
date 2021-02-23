import { getScreen, scale, event } from '../../main';
import * as GUI from '@babylonjs/gui/';
import { ActionInventoryClick } from 'voxelsrv-protocol/js/client';

import { ItemSlot, createSlot, updateSlot } from '../../parts/itemSlot';
import { defaultValues } from '../../../values';
import { getBaseInventory } from './base';
import { Engine } from 'noa-engine';
import { BaseSocket } from '../../../socket';
import { IInventory } from '../../../lib/player/entity';

export let chestInventory: GUI.Rectangle = null;

export function openChest(noa: Engine, socket: BaseSocket) {
	function getInv(): IInventory {
		return noa.ents.getState(noa.playerEntity, 'inventory');
	}

	const ui = getScreen(2);

	chestInventory = new GUI.Rectangle();
	chestInventory.zIndex = 15;
	chestInventory.verticalAlignment = 2;
	chestInventory.background = defaultValues.backgroundColor;
	chestInventory.thickness = 0;

	ui.addControl(chestInventory);

	const chestContainer = new GUI.Rectangle();
	chestContainer.zIndex = 16;
	chestContainer.verticalAlignment = 2;

	const chestTexture = new GUI.Image('inventory', './textures/gui/container/generic_top.png');
	chestTexture.width = `${180 * scale}px`;
	chestTexture.zIndex = 18;

	const inventorySlots: Array<ItemSlot> = new Array(36);
	const inventoryRow: Array<GUI.Rectangle> = [];

	const invSize = getInv().size;

	let rowNumber = 1//invSize <= 0 ? 0 : invSize >= 54 ? 6 : Math.ceil(invSize / 9);

	chestTexture.height = `${17 * scale + 18 * rowNumber * scale}px`;
	//chestTexture.sourceHeight = 135;
	chestTexture.populateNinePatchSlicesFromImage = true;
    chestTexture.stretch = GUI.Image.STRETCH_NINE_PATCH;


	chestContainer.addControl(chestTexture);

	for (let x = 1; x < rowNumber; x++) {
		const row = new GUI.Rectangle();
		row.zIndex = 30;
		row.verticalAlignment = 2;
		row.height = `${20 * scale}px`;
		row.width = `${164 * scale}px`;
		row.top = `${(x - 2) * 18 * scale}px`;
		row.thickness = 0;
		chestContainer.addControl(row);

		inventoryRow[x] = row;

		for (let y = 9 * x; y < 9 * x + 9; y++) {
			inventorySlots[y] = createSlot(scale);
			const container = inventorySlots[y].container;
			container.zIndex = 50;
			container.left = `${-18 * scale * 4 + 18 * scale * (y % 9)}px`;
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
				socket.send('ActionInventoryClick', { slot: y, type: click, inventory: ActionInventoryClick.TypeInv.HOOK });
			});

			container.onPointerEnterObservable.add((e) => {
				container.background = '#ffffff22';
			});

			container.onPointerOutObservable.add((e) => {
				container.background = '#00000000';
			});
			container.isPointerBlocker = true;
			row.addControl(container);
		}
	}

	const baseContainer = new GUI.Rectangle();
	baseContainer.zIndex = 16;
	baseContainer.verticalAlignment = 2;

	const base = getBaseInventory(noa, socket);
	base.inventory.top = `-${8 * scale}px`;

	const baseInventoryTexture = new GUI.Image('inventory', './textures/gui/container/generic_bottom.png');
	baseInventoryTexture.width = `${180 * scale}px`;
	baseInventoryTexture.height = `${107 * scale}px`;
	baseInventoryTexture.zIndex = 18;

	baseContainer.addControl(baseInventoryTexture);
	baseContainer.addControl(base.inventory);

	base.inventory.zIndex = 19;

	chestInventory.addControl(baseContainer);
	chestInventory.addControl(base.tempslot.container);
	chestInventory.addControl(chestContainer);
}

export function closeChest() {
	if (chestInventory != null) chestInventory.dispose();
	chestInventory = null;
}
