import { getScreen, scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { createItem } from '../parts/menu';

import { gameVersion, singleplayerServerInfo, singleplayerWorldTypes } from '../../values';
import { createSingleplayerServer } from '../../lib/singleplayer/setup';
import { setupConnection } from '../../lib/gameplay/connect';
import { Engine } from 'noa-engine';
import { SettingsGUI } from '../parts/settingsHelper';

export function buildWorldCreationGui(noa: Engine, takenNames: string[], openMenu, holder: GUI.Rectangle) {
	const menu = new SettingsGUI('worldCreation', [{ text: 'Create a new world' }]);

	menu.scroll.height = '70%'

	menu.createInput('name', 'World name', 'New world', 'World', 'Name your world!')

	const seed = menu.createInput('seed', 'Seed', '', 'Random seed', '');
	seed.input.onBeforeKeyAddObservable.add((input) => {
		let key = input.currentKey;
		if (key < '0' || key > '9') {
			seed.input.addKey = false;
		} else {
			seed.input.addKey = true;
		}
	});

	menu.createSlider(
		'worldSize',
		(v) => {
			const size = v * 64 * 16;
			return `World size: ${size}x${size}`;
		}, 2, 1, 8, 1
	);

	menu.createSelectable('worldType', (v) => `World type: ${toName(singleplayerWorldTypes[v])}`, 0, singleplayerWorldTypes)

	menu.createSettingButton('Create', () => {
		menu.main.dispose();
		

		const baseName = menu.settings['name'] || 'World';
		let name = baseName;
		let num = 0;

		while (takenNames.includes(name)) {
			num++;
			name = baseName + ' (' + num + ')';
		}

		let seedNum = 0;
		let tempSeed = parseInt(seed.input.text);

		if (tempSeed.toString() != 'NaN') seedNum = tempSeed;

		const socket = createSingleplayerServer(name, {
			gamemode: 'creative',
			gameVersion: gameVersion,
			serverVersion: '',
			worldsize: menu.settings['worldSize'] * 16,
			version: 0,
			seed: seedNum,
			generator: singleplayerWorldTypes[menu.settings['worldType']],
			icon: 'voxelsrv',
			displayName: baseName
		}, true);

		setupConnection(noa, socket, {...singleplayerServerInfo, motd: baseName });
	});

	menu.createSettingButton('Back', () => {
		menu.main.dispose();
		openMenu('singleplayer')
	});


	holder.addControl(menu.main);
}

function toName(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
