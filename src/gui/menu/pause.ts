import { getScreen, scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { disconnect, isSingleplayer, socketSend } from '../../lib/gameplay/connect';
import { createItem } from '../parts/menu';
import buildSettings from './settings';
import { defaultValues } from '../../values';
import buildAboutScreen from './about';

export let pauseScreen: GUI.Rectangle;

export default function buildPause(noa) {
	const ui = getScreen(2);

	let activeMenu;
	let active;

	pauseScreen = new GUI.Rectangle();
	pauseScreen.zIndex = 20;
	pauseScreen.verticalAlignment = 2;
	pauseScreen.background = defaultValues.backgroundColor;
	pauseScreen.thickness = 0;
	pauseScreen.isVisible = false;
	ui.addControl(pauseScreen);

	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	menu.height = `${200 * scale}px`;
	menu.width = `${160 * scale}px`;
	menu.background = defaultValues.menuColor;

	pauseScreen.addControl(menu);

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 13 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Pause';
	name.top = scale;

	menu.addControl(name);

	function openMenu(type: string) {
		switch (type) {
			case 'settings':
				activeMenu = buildSettings(noa, openMenu, pauseScreen);
				active = 'settings';
				pauseScreen.addControl(activeMenu);
				break;
			case 'about':
				activeMenu = buildAboutScreen(openMenu);
				active = 'about';
				pauseScreen.addControl(activeMenu);
				break;
			default:
				activeMenu.dispose();
				activeMenu = null;
				menu.isVisible = true;
				active = 'main';
				break;
		}
	}

	const items = new GUI.StackPanel();
	menu.addControl(items);

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Back to game', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		pauseScreen.isVisible = false;
		noa.container.canvas.requestPointerLock();
	});

	items.addControl(back.item);

	const settings = createItem();
	settings.item.verticalAlignment = 1;
	settings.text.text = [{ text: 'Settings', color: 'white', font: 'Lato' }];

	settings.item.onPointerClickObservable.add(() => {
		menu.isVisible = false;
		openMenu('settings');
	});

	items.addControl(settings.item);

	const about = createItem();
	about.item.verticalAlignment = 1;
	about.text.text = [{ text: 'About', color: 'white', font: 'Lato' }];

	about.item.onPointerClickObservable.add(() => {
		menu.isVisible = false;
		openMenu('about');
	});

	items.addControl(about.item);

	const discord = createItem();
	discord.text.text = [{ text: 'Discord', color: 'white', font: 'Lato' }];
	discord.item.onPointerClickObservable.add((e) => {
		window.open('https://discord.com/invite/K9PdsDh', '_blank');
	});
	items.addControl(discord.item);

	const disconnectItem = createItem();
	disconnectItem.item.verticalAlignment = 1;
	disconnectItem.text.text = [{ text: isSingleplayer() ? 'Save and leave' : 'Disconnect', color: 'white', font: 'Lato' }];

	disconnectItem.item.onPointerClickObservable.add(() => {
		pauseScreen.dispose();
		disconnect();
	});
	items.addControl(disconnectItem.item);

	const rescale = (x) => {
		menu.height = `${200 * scale}px`;
		menu.width = `${160 * scale}px`;

		name.fontSize = 13 * scale;

		items._children.forEach((z) => {
			z.width = `${100 * scale}px`;
			z.height = `${18 * scale}px`;
			//@ts-ignore
			z._children[0].fontSize = 10 * scale;
		});
	};

	event.on('scale-change', rescale);

	menu.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return menu;
}
