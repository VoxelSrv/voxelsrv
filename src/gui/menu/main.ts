import { getScreen, scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
//import buildSingleplayer from './singleplayer';
import buildMultiplayer from './multiplayer';
import buildSettings from './settings';
import { gameVersion, getSplash, hostedOn } from '../../values';
import { createItem } from '../../gui-uni/menu';
import { FormTextBlock } from '../../gui-uni/formtextblock';

export let holder: GUI.Rectangle;

export function buildMainMenu(noa) {
	const ui = getScreen(1);
	let activeMenu: GUI.Rectangle;
	let active: string;

	holder = new GUI.Rectangle();
	holder.thickness = 0;
	holder.isPointerBlocker = true;
	holder.zIndex = 5;

	ui.addControl(holder);

	const version = new GUI.TextBlock();
	version.text = !hostedOn ? `VoxelSRV ${gameVersion}` : `VoxelSRV ${gameVersion}/${hostedOn}`;
	version.fontFamily = 'Lato';
	version.fontSize = '26px';
	version.color = 'white';
	version.textHorizontalAlignment = 0;
	version.textVerticalAlignment = 1;
	version.left = '5px';
	version.top = '-5px';

	version.shadowColor = '#111111';
	version.shadowOffsetX = 1;
	version.shadowOffsetY = 1;

	holder.addControl(version);

	openMenu('main');

	function openMenu(type: string) {
		if (!!activeMenu) activeMenu.dispose();
		switch (type) {
			case 'singleplayer':
				//activeMenu = buildSingleplayer(noa, openMenu);
				active = 'singleplayer';
				document.title = 'VoxelSrv - Singleplayer Menu';
				break;
			case 'multiplayer':
				activeMenu = buildMultiplayer(noa, openMenu);
				active = 'multiplayer';
				document.title = 'VoxelSrv - Multiplayer Menu';
				break;
			case 'settings':
				activeMenu = buildSettings(noa, openMenu);
				active = 'settings';
				document.title = 'VoxelSrv - Settings';
				break;
			default:
				activeMenu = buildMenu();
				active = 'main';
				document.title = 'VoxelSrv - Main Menu';
				break;
		}

		holder.addControl(activeMenu);
	}

	function buildMenu() {
		const menu = new GUI.Rectangle();
		menu.thickness = 0;
		menu.horizontalAlignment = 2;
		menu.zIndex = 10;
		if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
		else menu.height = `100%`;
		menu.width = `${220 * scale}px`;
		menu.background = '#11111166';

		const logo = new GUI.Image('hotbar', './textures/mainlogo.png');
		logo.width = `${210 * scale}px`;
		logo.height = `${64 * scale}px`;
		logo.verticalAlignment = 0;
		logo.horizontalAlignment = 2;
		logo.top = `5px`;
		holder.zIndex = 15;
		menu.addControl(logo);

		const splash = new FormTextBlock();
		splash.text = getSplash();
		splash.fontFamily = 'Lato';
		splash.fontSize = `${9 * scale}px`;
		splash.color = 'yellow';
		splash.zIndex = 20;
		splash.width = `${200 * scale}px`;
		splash.height = `${10 * scale}px`;
		splash.textHorizontalAlignment = 2;
		splash.textVerticalAlignment = 2;
		splash.left = `${65 * scale}px`;
		if (window.innerHeight > 230 * scale) splash.top = `-${60 * scale}px`;
		else splash.top = `-${window.innerHeight / 4}px`;
		splash.rotation = -0.22;

		splash.shadowColor = '#111111';
		splash.shadowOffsetX = 1;
		splash.shadowOffsetY = 1;
		let addSplash = 0.005;

		window['changeSplash'] = () => {
			splash.text = getSplash();
		};

		const splashAnim = setInterval(() => {
			splash.scaleX = splash.scaleX + addSplash;
			splash.scaleY = splash.scaleY + addSplash;
			if (splash.scaleX > 1.1) addSplash = -0.005;
			else if (splash.scaleX < 1) addSplash = 0.005;
		}, 20);

		holder.addControl(splash);

		const items = new GUI.StackPanel();
		items.zIndex = 20;
		menu.addControl(items);

		if (window['electron'] != undefined) {
			const singleplayer = createItem();
			singleplayer.text.text = [{ text: 'Singleplayer', color: 'white', font: 'Lato' }];
			singleplayer.item.onPointerClickObservable.add((e) => {
				openMenu('singleplayer');
			});
			items.addControl(singleplayer.item);
		}

		const multiplayer = createItem();
		multiplayer.text.text = [{ text: 'Multiplayer', color: 'white', font: 'Lato' }];
		multiplayer.item.onPointerClickObservable.add((e) => {
			openMenu('multiplayer');
		});
		items.addControl(multiplayer.item);

		const settings = createItem();
		settings.text.text = [{ text: 'Settings', color: 'white', font: 'Lato' }];
		settings.item.onPointerClickObservable.add((e) => {
			openMenu('settings');
		});
		items.addControl(settings.item);

		const discord = createItem();
		discord.text.text = [{ text: 'Discord', color: 'white', font: 'Lato' }];
		discord.item.onPointerClickObservable.add((e) => {
			window.open('https://discord.com/invite/K9PdsDh', '_blank');
		});
		items.addControl(discord.item);

		const github = createItem();
		github.text.text = [{ text: 'Github', color: 'white', font: 'Lato' }];
		github.item.onPointerClickObservable.add((e) => {
			window.open('https://github.com/VoxelSrv/voxelsrv', '_blank');
		});
		items.addControl(github.item);

		const rescale = (x) => {
			if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
			else menu.height = `100%`;
			menu.width = `${220 * scale}px`;

			logo.width = `${210 * scale}px`;
			logo.height = `${64 * scale}px`;

			splash.left = `${65 * scale}px`;
			if (window.innerHeight > 230 * scale) splash.top = `-${60 * scale}px`;
			else splash.top = `-${window.innerHeight / 4}px`;
			splash.fontSize = `${9 * scale}px`;
			splash.width = `${200 * scale}px`;
			splash.height = `${10 * scale}px`;

			items._children.forEach((z) => {
				z.width = `${100 * scale}px`;
				z.height = `${18 * scale}px`;
				//@ts-ignore
				z._children[0].fontSize = 10 * scale;
			});
		};

		event.on('scale-change', rescale);

		menu.onDisposeObservable.add(() => {
			clearInterval(splashAnim);
			splash.dispose();
			event.off('scale-change', rescale);
		});

		return menu;
	}
}
