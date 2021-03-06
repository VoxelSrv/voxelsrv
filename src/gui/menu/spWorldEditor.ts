import { getScreen, scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { createItem } from '../parts/menu';

import { gameVersion, IWorldSettings, singleplayerServerInfo, singleplayerWorldTypes } from '../../values';
import { Engine } from 'noa-engine';
import { SettingsGUI } from '../parts/settingsHelper';
import { deleteWorld, IWorld, updateWorldSetting } from '../../lib/helpers/storage';
import { PopupGUI } from '../parts/miniPopupHelper';
import { createSingleplayerServer } from '../../lib/singleplayer/setup';

export function buildWorldEditorGui(noa: Engine, world: IWorld, openMenu, holder: GUI.Rectangle) {
	const menu = new SettingsGUI('worldEditor', [{ text: 'Edit world...' }]);

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

	menu.createSettingButton('Save changes...', async () => {
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
	
	menu.createSettingButton('Generate entire world', async () => {
		if (!menu.lock) {
			menu.lock = true;
			menu.main.isVisible = false;
			const screen = new PopupGUI([{ text: 'Pregenerating entire world...' }]);
			screen.setCenterText([{ text: "Loading world..." }]);

			const socket = createSingleplayerServer(world.name, world.settings, false);

			socket.on('ServerPregenerateStatus', (x) => {
				screen.setCenterText([{ text: `Generating world... ${(x.done/x.size*100).toFixed(0)}%\n[${x.done}/${x.size} chunks]` }]);
			})

			socket.on('ServerPregenerateDone', () => {
				screen.setCenterText([{ text: `Saving world...` }]);
				socket.send('SingleplayerLeave', {});
			})

			socket.on('ServerStarted', () => {
				console.log('Started!')
				socket.send('SingleplayerPregenerateWorld', {});
			})

			socket.on('ServerStopped', () => {
				screen.setCenterText([{ text: `Saving world...` }]);
			})

			socket.on('ServerStoppingDone', () => {
				screen.dispose();
				menu.lock = false;
				menu.main.isVisible = true;
			})
		
			screen.createItem('Cancel', async () => {
				screen.dispose();
				menu.lock = false;
				menu.main.isVisible = true;
				socket.attachedData.terminate();
			});

			getScreen(2).addControl(screen.main);
		}
	});

	menu.createSettingButton('Delete world...', () => {
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


	holder.addControl(menu.main);

	menu.createSettingButton('Back', () => {
		menu.main.dispose();
		openMenu('singleplayer');
	})
}

function toName(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
