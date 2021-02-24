import { getScreen, scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { createItem, createButton, createInput, createSlider } from '../parts/menu';

import { gameProtocol, gameVersion, IWorldSettings, singleplayerServerInfo, singleplayerWorldTypes } from '../../values';
import { createSingleplayerServer } from '../../lib/singleplayer/setup';
import { setupConnection } from '../../lib/gameplay/connect';
import { Engine } from 'noa-engine';
import { flatten, re } from 'mathjs';

export function buildWorldCreationGui(noa: Engine, takenNames: string[], openMenu) {
	const ui = getScreen(2);
	const menu = new GUI.Rectangle();

	menu.background = '#11111188';
	if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
	else menu.height = `100%`;
	menu.width = `${260 * scale}px`;
	menu.thickness = 0;
	menu.zIndex = 200;

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 11 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Create a new world';
	name.top = scale;
	menu.addControl(name)

	const settings = new GUI.StackPanel();
	settings.verticalAlignment = 0;
	settings.top = `${18 * scale}px`;
	settings.width = `${250 * scale}px`;
	settings.height = `80%`;

	const nickname = createInput();
	nickname.name.text = 'Worldname';
	nickname.input.placeholderText = `World`;
	nickname.input.text = 'World';

	settings.addControl(nickname.main);

	const seed = createInput();
	seed.name.text = 'Seed';
	seed.input.placeholderText = `Random seed`;
	seed.input.text = '';
	seed.input.onBeforeKeyAddObservable.add((input) => {
		let key = input.currentKey;
		if (key < '0' || key > '9') {
			seed.input.addKey = false;
		} else {
			seed.input.addKey = true;
		}
	})

	settings.addControl(seed.main);

	const worldSize = createSlider();
	worldSize.slider.maximum = 8;
	worldSize.slider.minimum = 1;
	worldSize.slider.value = 2
	worldSize.slider.step = 1;
	worldSize.slider.onValueChangedObservable.add((value) => {
		const size = value * 64 * 16;
		worldSize.name.text = `World size: ${size}x${size}`;
	})

	const size = 2 * 64 * 16;
	worldSize.name.text = `World size: ${size}x${size}`;

	settings.addControl(worldSize.main);

	let selWorldType = 0;

	const worldType = createItem();
	worldType.text.text = [{ text: `World type: ${toName(singleplayerWorldTypes[selWorldType])}`, color: 'white', font: 'Lato' }]
	worldType.item.onPointerClickObservable.add(() => {
		selWorldType = selWorldType + 1;
		if (selWorldType >= singleplayerWorldTypes.length) {
			selWorldType = 0;
		}

		worldType.text.text[0].text = `World type: ${toName(singleplayerWorldTypes[selWorldType])}`;
		worldType.text._markAsDirty();
	})

	settings.addControl(worldType.item)


	const create = createItem();
	create.item.verticalAlignment = 1;
	create.text.text = [{ text: 'Create', color: 'white', font: 'Lato' }];
	create.item.top = `-${16 * scale}px`;
	create.item.onPointerClickObservable.add(() => {
		menu.dispose();

		let name = nickname.input.text;
		let num = 0;

		while (takenNames.includes(name)) {
			num++;
			name = nickname.input.text + '(' + num + ')';
		}

		let seedNum = 0;
		let tempSeed = parseInt(seed.input.text);

		if (tempSeed.toString() != 'NaN') seedNum = tempSeed;

		const socket = createSingleplayerServer(name, {
			gamemode: 'creative',
			gameVersion: gameVersion,
			serverVersion: '',
			worldsize: worldSize.slider.value * 16,
			version: 0,
			seed: seedNum,
			generator: singleplayerWorldTypes[selWorldType],
		});

		setupConnection(noa, socket, singleplayerServerInfo);
	});

	menu.addControl(create.item);

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Back', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		menu.dispose();
		openMenu('singleplayer');
	});
	menu.addControl(back.item);

	menu.addControl(settings);
	ui.addControl(menu);

	const rescale = (x) => {
		if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
		else menu.height = `100%`;
		menu.width = `${260 * scale}px`;

		name.fontSize = 11 * scale;

		settings.top = `${18 * scale}px`;
		settings.width = `${250 * scale}px`;

		back.item.width = `${100 * scale}px`;
		back.item.height = `${18 * scale}px`;
		back.text.fontSize = 10 * scale;
	};

	event.on('scale-change', rescale);

	menu.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});
}


function toName(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1)
}