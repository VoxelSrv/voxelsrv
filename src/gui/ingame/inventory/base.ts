import { getScreen, scale, event } from '../../main';
import * as GUI from '@babylonjs/gui/';
import { ActionInventoryClick } from 'voxelsrv-protocol/js/client';

import { ItemSlot, createSlot, updateSlot } from '../../parts/itemSlot';
import { BaseSocket } from '../../../socket';
import { Engine } from 'noa-engine';

let page = 0;

export function getBaseInventory(noa: Engine, socket: BaseSocket) {
	function getInv() {
		return noa.ents.getState(noa.playerEntity, 'inventory');
	}

	const ui = getScreen(2);

	const hotbar = new GUI.Rectangle();
	hotbar.zIndex = 20;
	hotbar.verticalAlignment = 2;
	hotbar.top = `${40 * scale}px`;
	hotbar.height = `${20 * scale}px`;
	hotbar.width = `${164 * scale}px`;
	hotbar.thickness = 0;

	const inventory = new GUI.Rectangle();
	inventory.thickness = 0;

	inventory.addControl(hotbar);

	const hotbarSlots: Array<ItemSlot> = new Array(9);
	const inventorySlots: Array<ItemSlot> = new Array(36);
	const inventoryRow: Array<GUI.Rectangle> = [];

	for (let x = 1; x < 4; x++) {
		const row = new GUI.Rectangle();
		row.zIndex = 30;
		row.verticalAlignment = 2;
		row.height = `${20 * scale}px`;
		row.width = `${164 * scale}px`;
		row.top = `${(x - 2) * 18 * scale}px`;
		row.thickness = 0;
		inventory.addControl(row);

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
				socket.send('ActionInventoryClick', { slot: y + 27 * page, type: click, inventory: ActionInventoryClick.TypeInv.MAIN });
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

	const tempslot = createSlot(scale);
	tempslot.container.zIndex = 50;
	tempslot.container.verticalAlignment = 0;
	tempslot.container.horizontalAlignment = 0;
	tempslot.container.isPointerBlocker = false;
	tempslot.count.isPointerBlocker = false;
	tempslot.item.isPointerBlocker = false;

	const tempSlotUpdate = (data) => {
		tempslot.container.left = data.x + 10;
		tempslot.container.top = data.y + 10;
	};

	ui.onPointerMoveObservable.add(tempSlotUpdate);

	for (let x = 0; x < 9; x++) {
		hotbarSlots[x] = createSlot(scale);
		const container = hotbarSlots[x].container;
		container.zIndex = 40;
		container.left = `${-18 * scale * 4 + 18 * scale * x}px`;
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
			socket.send('ActionInventoryClick', { slot: x, type: click, inventory: ActionInventoryClick.TypeInv.MAIN });
		});

		container.onPointerEnterObservable.add((e) => {
			container.background = '#ffffff22';
		});

		container.onPointerOutObservable.add((e) => {
			container.background = '#00000000';
		});
		container.isPointerBlocker = true;
		hotbar.addControl(container);
	}

	const button: { [index: string]: any } = {};

	if (getInv().size > 36) {
		const box = new GUI.Rectangle();
		button.box = box;
		box.height = `${15 * scale}px`;
		box.width = `${22 * scale}px`;
		box.zIndex = 25;
		box.thickness = 0;
		box.top = `-${33 * scale}px`;
		box.left = `${71 * scale}px`;
		inventory.addControl(box);

		const inv = getInv();
		const button1 = new GUI.Image('button1', './textures/gui/button-right.png');
		button.button1 = button1;
		button1.zIndex = 25;
		button1.horizontalAlignment = 1;
		button1.height = `${15 * scale}px`;
		button1.width = `${11 * scale}px`;
		button1.onPointerClickObservable.add((e) => {
			page = page + 1;
			if (9 + page * 27 > inv.size) page = 0;
		});
		button1.isPointerBlocker = true;
		box.addControl(button1);

		const button2 = new GUI.Image('button2', './textures/gui/button-left.png');
		button.button2 = button2;
		button2.zIndex = 25;
		button2.horizontalAlignment = 0;
		button2.height = `${15 * scale}px`;
		button2.width = `${11 * scale}px`;
		button2.onPointerClickObservable.add((e) => {
			page = page - 1;
			if (page < 0) page = Math.floor((inv.size - 9) / 27);
		});
		button2.isPointerBlocker = true;
		box.addControl(button2);
	}

	const update = async () => {
		if (inventory.isVisible == false) return;

		const inv = getInv();

		updateSlot(tempslot, inv.tempslot);

		for (let x = 0; x < 9; x++) {
			updateSlot(hotbarSlots[x], inv.items[x]);
		}

		for (let x = 9; x < 36; x++) {
			updateSlot(inventorySlots[x], inv.items[27 * page + x]);
		}
	};

	noa.on('tick', update);

	const scaleEvent = (scale2) => {
		hotbar.top = `${40 * scale}px`;
		hotbar.height = `${20 * scale2}px`;
		hotbar.width = `${164 * scale2}px`;

		if (button.box != undefined) {
			button.box.height = `${15 * scale2}px`;
			button.box.width = `${22 * scale2}px`;
			button.box.top = `-${33 * scale}px`;
			button.box.left = `${71 * scale2}px`;

			button.button1.height = `${15 * scale2}px`;
			button.button1.width = `${11 * scale2}px`;
			button.button2.height = `${15 * scale2}px`;
			button.button2.width = `${11 * scale2}px`;
		}

		tempslot.container.height = `${16 * scale2}px`;
		tempslot.container.width = `${16 * scale2}px`;
		tempslot.item.width = `${16 * scale2}px`;
		tempslot.item.height = `${16 * scale2}px`;
		tempslot.count.fontSize = `${8 * scale2}px`;
		tempslot.count.left = `${2 * scale2}px`;
		tempslot.count.top = `${4 * scale2}px`;
		tempslot.count.shadowOffsetX = scale2;
		tempslot.count.shadowOffsetY = scale2;

		for (let x = 0; x < hotbarSlots.length; x++) {
			hotbarSlots[x].container.height = `${16 * scale2}px`;
			hotbarSlots[x].container.width = `${16 * scale2}px`;
			hotbarSlots[x].container.left = `${-18 * scale2 * 4 + 18 * scale2 * (x % 9)}px`;
			hotbarSlots[x].item.width = `${16 * scale2}px`;
			hotbarSlots[x].item.height = `${16 * scale2}px`;
			hotbarSlots[x].count.fontSize = `${8 * scale2}px`;
			hotbarSlots[x].count.left = `${2 * scale2}px`;
			hotbarSlots[x].count.top = `${4 * scale2}px`;
			hotbarSlots[x].count.shadowOffsetX = scale2;
			hotbarSlots[x].count.shadowOffsetY = scale2;
		}

		for (let x = 1; x < 4; x++) {
			inventoryRow[x].height = `${20 * scale2}px`;
			inventoryRow[x].width = `${164 * scale2}px`;
			inventoryRow[x].top = `${(x - 2) * 18 * scale}px`;


			for (let y = 9 * x; y < 9 * x + 9; y++) {
				inventorySlots[y].container.left = `${-18 * scale2 * 4 + 18 * scale2 * (y % 9)}px`;
				inventorySlots[y].container.height = `${16 * scale2}px`;
				inventorySlots[y].container.width = `${16 * scale2}px`;
				inventorySlots[y].item.width = `${16 * scale2}px`;
				inventorySlots[y].item.height = `${16 * scale2}px`;
				inventorySlots[y].count.fontSize = `${8 * scale2}px`;
				inventorySlots[y].count.left = `${2 * scale2}px`;
				inventorySlots[y].count.top = `${4 * scale2}px`;
				inventorySlots[y].count.shadowOffsetX = scale2;
				inventorySlots[y].count.shadowOffsetY = scale2;
			}
		}
	};

	event.on('scale-change', scaleEvent);

	inventory.onDisposeObservable.add(() => {
		event.off('scale-change', scaleEvent);
		noa.off('tick', update);

		ui.onPointerMoveObservable.removeCallback(tempSlotUpdate);
	});

	return { inventory, inventoryRow, inventorySlots, hotbarSlots, tempslot, button };
}
