import { getScreen, scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { createItem } from '../parts/menu';

import { gameVersion, IWorldSettings, singleplayerServerInfo, singleplayerWorldTypes } from '../../values';
import { Engine } from 'noa-engine';
import { SettingsGUI } from '../parts/settingsHelper';
import { deleteWorld, IWorld, updateWorldSetting } from '../../lib/helpers/storage';
import { PopupGUI } from '../parts/miniPopupHelper';
import { TubeBuilder } from '@babylonjs/core';

export function buildWorldEditorGui(noa: Engine, world: IWorld, openMenu, holder: GUI.Rectangle) {
	const menu = new SettingsGUI('worldEditor', [{ text: 'Edit world...' }], () => {
		openMenu('singleplayer');
	});

	menu.scroll.height = '70%';

	menu.createInput('name', 'World name', world.settings.displayName || world.name, world.name, 'Name your world!');

	menu.createSlider(
		'worldSize',
		(v) => {
			const size = v * 64 * 16;
			return `World size: ${size}x${size}`;
		},
		world.settings.worldsize / 16,
		world.settings.worldsize / 16,
		8,
		1
	);

	const save = createItem();
	save.item.verticalAlignment = 1;
	save.text.text = [{ text: 'Save changes...', color: 'white', font: 'Lato' }];
	save.item.top = `-${32 * scale}px`;
	save.item.onPointerClickObservable.add(async () => {
		if (!menu.lock) {
			menu.main.dispose();

			const newSettings: IWorldSettings = {
				gamemode: world.settings.gamemode,
				gameVersion: world.settings.gameVersion,
				serverVersion: world.settings.serverVersion,
				worldsize: menu.settings['worldSize'] * 16,
				version: world.settings.version,
				seed: world.settings.seed,
				generator: world.settings.generator,
				displayName: menu.settings['name'],
				icon: world.settings.icon,
			};

			await updateWorldSetting(world.name, newSettings, world.lastplay);

			openMenu('singleplayer');
		}
	});

	const del = createItem();
	del.item.verticalAlignment = 1;
	del.text.text = [{ text: 'Delete world...', color: 'white', font: 'Lato' }];
	del.item.top = `-${16 * scale}px`;
	del.item.onPointerClickObservable.add(() => {
		if (!menu.lock) {
			menu.lock = true;
			menu.main.isVisible = false;
			const delScreen = new PopupGUI([{ text: 'Confirm deletion...' }]);
			delScreen.setCenterText([{ text: "Are you sure?\nYou won't be able to restore it!" }]);
			delScreen.createItem('Delete', async () => {
				menu.main.dispose();
				delScreen.dispose();
				await deleteWorld(world.name);
				openMenu('singleplayer');
			});

			delScreen.createItem('Cancel', async () => {
				delScreen.dispose();
				menu.lock = false;
				menu.main.isVisible = true;
			});

			getScreen(2).addControl(delScreen.main);
		}
	});

	menu.main.addControl(del.item);

	menu.main.addControl(save.item);

	holder.addControl(menu.main);

	const rescale = (x) => {
		save.item.width = `${100 * scale}px`;
		save.item.height = `${18 * scale}px`;
		save.text.fontSize = 10 * scale;
		del.item.top = `-${16 * scale}px`;
		save.item.top = `-${16 * scale}px`;
	};

	event.on('scale-change', rescale);

	menu.main.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});
}

function toName(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
