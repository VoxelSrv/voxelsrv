import { items } from "../../lib/gameplay/registry";
import * as GUI from '@babylonjs/gui/';

export type ItemSlot = {
	item: GUI.Image;
	container: GUI.Rectangle;
	count: GUI.TextBlock;
};

export function createSlot(scale: number): ItemSlot {
	const slot = {
		item: new GUI.Image('hotbar', ''),
		container: new GUI.Rectangle(),
		count: new GUI.TextBlock(),
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
	count.text = '';
	count.fontFamily = `silkscreen`;
	count.color = '#f0f0f0';

	count.fontSize = `${8 * scale}px`;
	count.left = `${2 * scale}px`;
	count.top = `${4 * scale}px`;

	count.shadowColor = '#111111';
	count.shadowOffsetX = scale;
	count.shadowOffsetY = scale;

	container.addControl(count);

	return slot;
}

export function updateSlot(guiSlot, invItem): boolean {
	if (invItem != null && invItem.id != undefined) {
		guiSlot.item.alpha = 1;
		guiSlot.count.alpha = 1;
		const item = items[invItem.id];
		let txt: string;
		if (item == undefined) txt = './textures/error.png';
		else if (!item.texture.startsWith('https://') || !item.texture.startsWith('http://')) txt = './textures/' + item.texture + '.png';
		else txt = item.texture;

		guiSlot.item.source = txt;

		if (invItem.count == 1) guiSlot.count.text = '';
		else if (invItem.count <= 10) guiSlot.count.text = ' ' + invItem.count.toString();
		else guiSlot.count.text = invItem.count.toString();

		return true;
	} else {
		guiSlot.item.alpha = 0;
		guiSlot.count.alpha = 0;

		guiSlot.item.source = '';
		guiSlot.count.text = '';

		return false;
	}
}
