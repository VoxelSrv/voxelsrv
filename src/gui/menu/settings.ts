import { scale, event, setScale } from '../main';
import * as GUI from '@babylonjs/gui/';
import { createItem, createInput, createSlider, createCheckbox } from '../parts/menu';
import { defaultValues, gameSettings, updateSettings } from '../../values';
import { isSingleplayer, socket, socketSend } from '../../lib/gameplay/connect';

export default function buildSettings(noa, openMenu) {
	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
	else menu.height = `100%`;
	menu.width = `${220 * scale}px`;
	menu.background = defaultValues.menuColor;

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 11 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Settings';
	name.top = scale;

	menu.addControl(name);

	const scroll = new GUI.ScrollViewer();
	scroll.verticalAlignment = 0;
	scroll.top = `${18 * scale}px`;
	scroll.width = `${210 * scale}px`;
	scroll.height = `80%`;
	scroll.thickness = 0;
	scroll.barColor = '#ffffff44';
	scroll.barBackground = '#00000000';

	menu.addControl(scroll);

	const settings = new GUI.StackPanel();
	scroll.addControl(settings);

	const nickname = createInput();
	nickname.name.text = 'Nickname';
	nickname.input.placeholderText = `Write your nickname`;
	nickname.input.text = gameSettings.nickname;
	nickname.input.promptMessage = 'Enter your nickname';

	settings.addControl(nickname.main);

	const mouse = createSlider();
	mouse.name.text = `Mouse sensitivity: ${gameSettings.mouse}`;
	mouse.slider.value = gameSettings.mouse;
	mouse.slider.minimum = 1;
	mouse.slider.maximum = 80;
	mouse.slider.step = 1;
	mouse.slider.onValueChangedObservable.add((x) => {
		mouse.name.text = `Mouse sensitivity: ${x}`;
	});

	settings.addControl(mouse.main);

	const scaleS = createSlider();
	scaleS.name.text = `GUI scale: ${gameSettings.scale}`;
	scaleS.slider.value = gameSettings.scale;
	scaleS.slider.minimum = 2;
	scaleS.slider.maximum = 5;
	scaleS.slider.step = 1;
	scaleS.slider.onValueChangedObservable.add((x) => {
		scaleS.name.text = `GUI scale: ${x}`;
	});

	settings.addControl(scaleS.main);

	const gamepad = createCheckbox();
	gamepad.name.text = `Enable gamepad: ${gameSettings.gamepad}`;
	gamepad.isChecked = gameSettings.gamepad;
	gamepad.main.onPointerClickObservable.add(() => {
		gamepad.isChecked = !gamepad.isChecked;
		gamepad.name.text = `Enable gamepad: ${gamepad.isChecked}`;
	});

	settings.addControl(gamepad.main);

	const fov = createSlider();
	fov.name.text = `FOV: ${gameSettings.fov}`;
	fov.slider.value = gameSettings.fov;
	fov.slider.minimum = 20;
	fov.slider.maximum = 120;
	fov.slider.step = 1;
	fov.slider.onValueChangedObservable.add((x) => {
		fov.name.text = `FOV: ${x}`;
	});

	settings.addControl(fov.main);

	const view = createSlider();
	view.name.text = `View Distance: ${gameSettings.viewDistance}`;
	view.slider.value = gameSettings.viewDistance;
	view.slider.minimum = 2;
	view.slider.maximum = 16;
	view.slider.step = 1;
	view.slider.onValueChangedObservable.add((x) => {
		view.name.text = `View Distance: ${x}`;
	});

	settings.addControl(view.main);

	const debug = createCheckbox();
	debug.name.text = `Enable debug info: ${gameSettings.debugInfo}`;
	debug.isChecked = gameSettings.debugInfo;
	debug.main.onPointerClickObservable.add(() => {
		debug.isChecked = !debug.isChecked;
		debug.name.text = `Enable debug info: ${debug.isChecked}`;
	});

	settings.addControl(debug.main);

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Back', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		updateSettings({
			nickname: nickname.input.text,
			mouse: mouse.slider.value,
			scale: scaleS.slider.value,
			gamepad: gamepad.isChecked,
			viewDistance: view.slider.value,
			fov: fov.slider.value,
			debugInfo: debug.isChecked,
		});

		noa.camera.sensitivityX = mouse.slider.value;
		noa.camera.sensitivityY = mouse.slider.value;

		noa.world.chunkAddDistance = view.slider.value;
		noa.world.chunkRemoveDistance = view.slider.value + 0.5;

		if (isSingleplayer()) {
			socketSend('SingleplayerViewDistance', { value: view.slider.value });
		}

		noa.rendering.getScene().cameras[0].fov = (fov.slider.value * Math.PI) / 180;

		menu.dispose();
		openMenu('main');
	});
	menu.addControl(back.item);

	const rescale = (x) => {
		if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
		else menu.height = `100%`;

		menu.width = `${220 * scale}px`;

		name.fontSize = 11 * scale;

		scroll.top = `${18 * scale}px`;
		scroll.width = `${210 * scale}px`;

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
