import { getLayer, getUI, getScreen, ShadowText } from './main';
import { items } from '../lib/registry';
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import * as GUI from '@babylonjs/gui/';
import { Socket } from '../socket';
import { buildMain } from '../html-gui/menu/main';

export function buildHotbar(noa) {
	function getInv() {
		return noa.ents.getState(noa.playerEntity, 'inventory');
	}

	const ui = getUI(0);
	const scene = getLayer(0);
	const scale = 3;

	const hotbar = new GUI.Rectangle();
	hotbar.zIndex = 20;
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
	hotbarSelected.zIndex = 50;
	hotbarSelected.width = `${24 * scale}px`;
	hotbarSelected.height = `${24 * scale}px`;
	hotbarSelected.left = `${-19 * scale * 4}px`;
	hotbar.addControl(hotbarSelected);

	const hotbarSlots = new Array(9);

	for (let x = 0; x < 9; x++) {
		hotbarSlots[x] = createSlot(scale);
		const container = hotbarSlots[x].container;
		container.zIndex = 20;
		container.left = `${-20 * scale * 4 + 20 * scale * x}px`;
		hotbar.addControl(container);
	}

	noa.on('beforeRender', async () => {
		const inv = getInv();
		hotbarSelected.left = `${-20 * scale * 4 + 20 * scale * inv.selected}px`;

		for (let x = 0; x < 9; x++) {
			if (inv.items[x] != null && inv.items[x].id != undefined) {
				let txt = items[inv.items[x].id].texture + '.png';
				if (!txt.startsWith('https://') || !txt.startsWith('http://')) txt = './textures/' + txt;
				hotbarSlots[x].item.source = txt;

				if (inv.items[x].count == 1) hotbarSlots[x].count.set('text', '');
				else if (inv.items[x].count <= 10) hotbarSlots[x].count.set('text', ' ' + inv.items[x].count.toString());
				else hotbarSlots[x].count.set('text', inv.items[x].count.toString());
			} else {
				hotbarSlots[x].item.source = '';
				hotbarSlots[x].count.text = '';
			}
		}
	});
}

export let inventory: GUI.Rectangle;
let page = 0;

export function buildInventory(noa, socket) {
	function getInv() {
		return noa.ents.getState(noa.playerEntity, 'inventory');
	}

	const ui = getScreen(1);
	const scene = getLayer(1);
	const scale = 3;

	inventory = new GUI.Rectangle();
	inventory.zIndex = 20;
	inventory.verticalAlignment = 2;
	inventory.background = '#00000077';
	inventory.thickness = 0;
	inventory.isVisible = false;
	ui.addControl(inventory);

	const inventoryTexture = new GUI.Image('inventory', './textures/gui/container/inventory.png');
	inventoryTexture.width = `${180 * scale}px`;
	inventoryTexture.height = `${176 * scale}px`;
	inventoryTexture.zIndex = 10;

	inventory.addControl(inventoryTexture);

	const hotbar = new GUI.Rectangle();
	hotbar.zIndex = 20;
	hotbar.verticalAlignment = 2;
	hotbar.top = `${67 * scale}px`;
	hotbar.height = `${20 * scale}px`;
	hotbar.width = `${164 * scale}px`;
	hotbar.thickness = 0;

	inventory.addControl(hotbar);

	const hotbarSlots = new Array(9);
	const inventorySlots = new Array(36);
	const inventoryRow: Array<GUI.Rectangle> = [];

	for (let x = 1; x < 4; x++) {
		const row = new GUI.Rectangle();
		row.zIndex = 20;
		row.verticalAlignment = 2;
		row.height = `${20 * scale}px`;
		row.width = `${164 * scale}px`;
		row.top = `${9 * scale + (x - 1) * 18 * scale}px`;
		row.thickness = 0;
		inventory.addControl(row);

		inventoryRow[x] = row;

		for (let y = 9 * x; y < 9 * x + 9; y++) {
			inventorySlots[y] = createSlot(scale);
			const container = inventorySlots[y].container;
			container.zIndex = 20;
			container.left = `${-18 * scale * 4 + 18 * scale * (y % 9)}px`;
			container.onPointerClickObservable.add((e) => {
				let click = 'left';
				switch (e.buttonIndex) {
					case 0:
						click = 'left';
						break;
					case 1:
						click = 'middle';
						break;
					case 2:
						click = 'right';
						break;
				}
				console.log({ slot: y + 27 * page, type: click });

				socket.send('actionInventoryClick', { slot: y + 27 * page, type: click, inventory: 'main' });
			});
			container.isPointerBlocker = true;
			row.addControl(container);
		}
	}

	const tempslot = createSlot(scale);
	tempslot.container.zIndex = 50;
	tempslot.container.verticalAlignment = 0;
	tempslot.container.horizontalAlignment = 0;

	inventory.addControl(tempslot.container);

	for (let x = 0; x < 9; x++) {
		hotbarSlots[x] = createSlot(scale);
		const container = hotbarSlots[x].container;
		container.zIndex = 20;
		container.left = `${-18 * scale * 4 + 18 * scale * x}px`;
		container.onPointerClickObservable.add((e) => {
			let click = 'left';
			switch (e.buttonIndex) {
				case 0:
					click = 'left';
					break;
				case 1:
					click = 'middle';
					break;
				case 2:
					click = 'right';
					break;
			}

			socket.send('actionInventoryClick', { slot: x, type: click, inventory: 'main' });
		});
		container.isPointerBlocker = true;
		hotbar.addControl(container);
	}

	const armor = new GUI.Rectangle();
	armor.zIndex = 30;
	armor.verticalAlignment = 2;
	armor.top = `${-39 * scale}px`;
	armor.left = `${-72 * scale}px`
	armor.height = `${72 * scale}px`;
	armor.width = `${18 * scale}px`;
	armor.thickness = 0;

	inventory.addControl(armor);

	const armorSlots = new Array(4);

	for (let x = 0; x < 4; x++) {
		armorSlots[x] = createSlot(scale);
		const container = armorSlots[x].container;
		container.zIndex = 20;
		container.verticalAlignment = 0;
		container.top = `${18 * scale * x}px`;
		container.onPointerClickObservable.add((e) => {
			let click = 'left';
			switch (e.buttonIndex) {
				case 0:
					click = 'left';
					break;
				case 1:
					click = 'middle';
					break;
				case 2:
					click = 'right';
					break;
			}

			console.log({ slot: x, type: click, inventory: 'armor' })
			socket.send('actionInventoryClick', { slot: x, type: click, inventory: 'armor' });
		});
		container.isPointerBlocker = true;
		armor.addControl(container);
	}

	ui.onPointerMoveObservable.add((data) => {
		tempslot.container.left = data.x;
		tempslot.container.top = data.y;
	});

	if (getInv().size > 36) {
		const box = new GUI.Rectangle();
		box.height = `${15 * scale}px`;
		box.width = `${22 * scale}px`;
		box.zIndex = 25;
		box.thickness = 0;
		box.top = `${-6 * scale}px`;
		box.left = `${71 * scale}px`;
		inventory.addControl(box);

		const inv = getInv();
		const button1 = new GUI.Image('button1', './textures/gui/button-right.png');
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
		button2.zIndex = 25;
		button2.horizontalAlignment = 0;
		button2.height = `${15 * scale}px`;
		button2.width = `${11 * scale}px`;
		button2.onPointerClickObservable.add((e) => {
			page = page - 1;
			if (page < 0) page = Math.round(27 / ((inv.size - 9) / 27) / 3 - 1);
		});
		button2.isPointerBlocker = true;
		box.addControl(button2);
	}

	const update = async () => {
		const inv = getInv();

		if (inv.tempslot != null && inv.tempslot.id != undefined) {
			tempslot.container.alpha = 1;

			let txt = items[inv.tempslot.id].texture + '.png';
			if (!txt.startsWith('https://') || !txt.startsWith('http://')) txt = './textures/' + txt;
			tempslot.item.source = txt;

			if (inv.tempslot.count == 1) tempslot.count.set('text', '');
			else if (inv.tempslot.count <= 10) tempslot.count.set('text', ' ' + inv.tempslot.count.toString());
			else tempslot.count.set('text', inv.tempslot.count.toString());
		} else {
			tempslot.container.alpha = 0;
			tempslot.item.source = '';
			tempslot.count.set('text', '');
		}

		for (let x = 0; x < 9; x++) {
			if (inv.items[x] != null && inv.items[x].id != undefined) {
				hotbarSlots[x].container.alpha = 1;

				let txt = items[inv.items[x].id].texture + '.png';
				if (!txt.startsWith('https://') || !txt.startsWith('http://')) txt = './textures/' + txt;
				hotbarSlots[x].item.source = txt;

				if (inv.items[x].count == 1) hotbarSlots[x].count.set('text', '');
				else if (inv.items[x].count <= 10) hotbarSlots[x].count.set('text', ' ' + inv.items[x].count.toString());
				else hotbarSlots[x].count.set('text', inv.items[x].count.toString());
			} else {
				hotbarSlots[x].container.alpha = 0;
				hotbarSlots[x].item.source = '';
				hotbarSlots[x].count.set('text', '');
			}
		}

		for (let x = 9; x < 36; x++) {
			const y = 27 * page + x;
			if (inv.items[y] != null && inv.items[y].id != undefined) {
				inventorySlots[x].container.alpha = 1;

				let txt = items[inv.items[y].id].texture + '.png';
				if (!txt.startsWith('https://') || !txt.startsWith('http://')) txt = './textures/' + txt;
				inventorySlots[x].item.source = txt;

				if (inv.items[y].count == 1) inventorySlots[x].count.set('text', '');
				else if (inv.items[y].count <= 10) inventorySlots[x].count.set('text', ' ' + inv.items[y].count.toString());
				else inventorySlots[x].count.set('text', inv.items[y].count.toString());
			} else if (y > inv.size) {
				inventorySlots[x].container.alpha = 1;
				inventorySlots[x].item.source = './textures/gui/noslot.png';
				inventorySlots[x].count.set('text', '');
			} else {
				inventorySlots[x].container.alpha = 0;
				inventorySlots[x].item.source = '';
				inventorySlots[x].count.set('text', '');
			}
		}

		for (let x = 0; x < 4; x++) {
			if (inv.armor.items[x] != null && inv.armor.items[x].id != undefined) {
				armorSlots[x].container.alpha = 1;

				let txt = items[inv.armor.items[x].id].texture + '.png';
				if (!txt.startsWith('https://') || !txt.startsWith('http://')) txt = './textures/' + txt;
				armorSlots[x].item.source = txt;

				if (inv.armor.items[x].count == 1) armorSlots[x].count.set('text', '');
				else if (inv.armor.items[x].count <= 10)
					armorSlots[x].count.set('text', ' ' + inv.armor.items[x].count.toString());
				else armorSlots[x].count.set('text', inv.armor.items[x].count.toString());
			} else {
				armorSlots[x].container.alpha = 0;
				armorSlots[x].item.source = '';
				armorSlots[x].count.set('text', '');
			}
		}
	};

	noa.on('beforeRender', update);
}

export function createSlot(scale: number) {
	const slot = {
		item: new GUI.Image('hotbar', ''),
		container: new GUI.Rectangle(),
		count: new ShadowText(50),
	};

	const container = slot.container;
	container.zIndex = 20;
	container.height = `${16 * scale}px`;
	container.width = `${16 * scale}px`;
	container.thickness = 0;

	const item = slot.item;
	item.width = `${16 * scale}px`;
	item.height = `${16 * scale}px`;

	container.addControl(item);

	const count = slot.count;
	count.set('text', '');
	count.set('fontFamily', `silkscreen`);
	count.main.color = '#f0f0f0';
	count.shadow.color = '#111111';

	count.set('fontSize', `${8 * scale}px`);
	count.set('left', `${3 * scale}px`);
	count.set('top', `${5 * scale}px`);

	container.addControl(count.main);

	return slot;
}

window['inv'] = buildInventory;
