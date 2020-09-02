import { scale, event, getUI, getScreen } from '../main';
import * as GUI from '@babylonjs/gui/';
import { FormTextBlock } from '../../gui-uni/formtextblock';
import { buildMainMenu } from './main';

export default function buildDisconnect(reasontext, noa, connect) {
	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	menu.height = `${100 * scale}px`;
	menu.width = `${180 * scale}px`;
	menu.background = '#11111166';

	getScreen(1).addControl(menu);

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 11 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Disconnected!';
	name.top = scale;

	menu.addControl(name);

	const reason = new GUI.TextBlock();
	reason.fontFamily = 'Lato';
	reason.fontSize = 9 * scale;
	reason.textVerticalAlignment = 2;
	reason.color = 'white';
	reason.text = reasontext;
	reason.textWrapping = GUI.TextWrapping.WordWrap;

	menu.addControl(reason);

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Go back to menu', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		menu.dispose();
		buildMainMenu(noa, connect);
	});
	menu.addControl(back.item);

	const rescale = (x) => {
		menu.height = `${100 * scale}px`;
		menu.width = `${180 * scale}px`;

		name.fontSize = 11 * scale;

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

function createItem() {
	const item = new GUI.Rectangle();
	item.width = `${100 * scale}px`;
	item.height = `${18 * scale}px`;
	item.isPointerBlocker = true;
	item.horizontalAlignment = 2;
	item.thickness = 0;
	item.paddingBottom = '10px';
	item.zIndex = 10;

	const text = new FormTextBlock();
	text.text = [{ text: 'MenuItemText', color: 'white', font: 'Lato' }];
	text.fontSize = 10 * scale;
	text.textHorizontalAlignment = 2;
	item.addControl(text);

	item.onPointerEnterObservable.add((e) => {
		text.text.forEach((x) => (x.underline = true));
		text._markAsDirty();
	});

	item.onPointerOutObservable.add((e) => {
		text.text.forEach((x) => (x.underline = false));
		text._markAsDirty();
	});

	return { item: item, text: text };
}

function createRow() {
	const main = new GUI.Rectangle();
	main.height = '40px';
	main.thickness = 0;

	const name = new GUI.Rectangle();
	name.width = '20%';
	name.horizontalAlignment = 0;
	name.thickness = 0;
	main.addControl(name);

	const motd = new GUI.Rectangle();
	motd.width = '50%';
	motd.horizontalAlignment = 0;
	motd.left = '20%';
	motd.thickness = 0;
	main.addControl(motd);

	const players = new GUI.Rectangle();
	players.width = '10%';
	players.horizontalAlignment = 0;
	players.left = '70%';
	players.thickness = 0;
	main.addControl(players);

	const software = new GUI.Rectangle();
	software.width = '20%';
	software.horizontalAlignment = 0;
	software.left = '80%';
	software.thickness = 0;
	main.addControl(software);

	return { main, name, motd, players, software };
}
