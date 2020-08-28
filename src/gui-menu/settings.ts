import { scale, event } from '../gui/main';
import * as GUI from '@babylonjs/gui/';
import { FormTextBlock } from '../gui-uni/formtextblock';
import { createItem, createInput, createSlider } from '../gui-uni/menu';
import { gameSettings, updateSettings } from '../values';

export default function buildSettings(noa, openMenu) {
	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	menu.height = `${230 * scale}px`;
	menu.width = `${220 * scale}px`;
	menu.background = '#11111166';

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 11 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Settings';
	name.top = scale;

	menu.addControl(name);

	const settings = new GUI.StackPanel();
	settings.verticalAlignment = 0;
	settings.top = `${18 * scale}px`;
	settings.width = `${210 * scale}px`;
	settings.height = `${190 * scale}px`;

	menu.addControl(settings);

	const nickname = createInput();
	nickname.name.text = 'Nickname';
	nickname.input.placeholderText = `Write your nickname`;
	nickname.input.text = gameSettings.nickname;

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

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Back', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		updateSettings({
			nickname: nickname.input.text,
			mouse: mouse.slider.value,
		});

		noa.camera.sensitivityX = mouse.slider.value;
		noa.camera.sensitivityY = mouse.slider.value;

		menu.dispose();
		openMenu('main');
	});
	menu.addControl(back.item);

	const rescale = (x) => {
		menu.height = `${230 * scale}px`;
		menu.width = `${220 * scale}px`;

		name.fontSize = 11 * scale;

		settings.top = `${18 * scale}px`;
		settings.width = `${210 * scale}px`;
		settings.height = `${190 * scale}px`;

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
