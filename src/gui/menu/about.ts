import { scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { FormTextBlock } from '../parts/formtextblock';
import { createItem } from '../parts/menu';

import { aboutText, defaultValues, gameVersion } from '../../values';

export default function buildAboutScreen(openMenu) {
	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
	else menu.height = `100%`;
	menu.width = `${310 * scale}px`;
	menu.background = defaultValues.menuColor;

	const logo = new GUI.Image('hotbar', './textures/mainlogo.png');
	logo.width = `${105 * scale}px`;
	logo.height = `${32 * scale}px`;
	logo.verticalAlignment = 0;
	logo.horizontalAlignment = 2;
	logo.top = `5px`;
	menu.addControl(logo);

	const text = new FormTextBlock();
	text.fontFamily = 'Lato';
	text.fontSize = 8 * scale;
	text.textVerticalAlignment = 0;
	text.top = `${36 * scale}px`;
	text.color = 'white';
	text.text = aboutText;

	text.onPointerDownObservable.add((data) => {
		text.getTextAreas.forEach((txt) => {
			if (txt.x1 <= data.x && txt.x2 >= data.x && txt.y1 >= data.y && txt.y2 <= data.y) {
				if (txt.ref.url != undefined) window.open(txt.ref.url, '_blank');
			}
		});
	});

	menu.addControl(text);

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Back', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		menu.dispose();
		openMenu('main');
	});
	menu.addControl(back.item);

	const rescale = (x) => {
		if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
		else menu.height = `100%`;
		menu.width = `${310 * scale}px`;
		logo.width = `${105 * scale}px`;
		logo.height = `${32 * scale}px`;

		text.top = `${36 * scale}px`;
		text.fontSize = 8 * scale;

		back.item.width = `${100 * scale}px`;
		back.item.height = `${18 * scale}px`;
		back.text.fontSize = 10 * scale;
	};

	event.on('scale-change', rescale);

	menu.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return menu;
}
