/*
* Main gui elemets are builded in these functions.
* Just to limit duplicated code.
*/

import { scale, event } from '../main';
import { FormTextBlock } from './formtextblock';
import * as GUI from '@babylonjs/gui';

export function createItem(width: number = 100, fontsize: number = 10, height: number = 18) {
	const item = new GUI.Rectangle();
	item.width = `${width * scale}px`;
	item.height = `${height * scale}px`;
	item.isPointerBlocker = true;
	item.horizontalAlignment = 2;
	item.thickness = 0;
	item.paddingBottom = '10px';
	item.zIndex = 10;

	const text = new FormTextBlock();
	text.text = [{ text: 'MenuItemText', color: 'white', font: 'Lato' }];
	text.fontSize = fontsize * scale;
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

	const rescale = (x) => {
		item.width = `${width * scale}px`;
		item.height = `${height * scale}px`;

		text.fontSize = fontsize * scale;
	};

	event.on('scale-change', rescale);

	item.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});


	return { item: item, text: text };
}

export function createInput(isPassword: boolean = false) {
	const main = new GUI.Rectangle();
	main.height = `${28 * scale}px`;
	main.adaptWidthToChildren = true;

	main.thickness = 0;
	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 9 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Input';
	name.top = scale;
	name.verticalAlignment = 0;

	main.addControl(name);

	const input = isPassword ? new GUI.InputPassword() : new GUI.InputText();
	input.thickness = 0;
	input.background = '#ffffffaa';
	input.focusedBackground = '#ffffffff';
	input.placeholderText = 'Placeholder';
	input.color = '#666666';
	input.verticalAlignment = 0;
	input.height = `${15 * scale}px`;
	input.width = `${100 * scale}px`;
	input.top = `${14 * scale}px`;

	main.addControl(input);

	const rescale = (x) => {
		main.height = `${28 * scale}px`;
		name.fontSize = 9 * scale;
		input.height = `${15 * scale}px`;
		input.width = `${100 * scale}px`;
		input.top = `${14 * scale}px`;
	};

	event.on('scale-change', rescale);

	main.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return { main, name, input };
}

export function createSlider() {
	const main = new GUI.Rectangle();
	main.height = `${28 * scale}px`;
	main.adaptWidthToChildren = true;
	main.thickness = 0;

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 9 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Slider';
	name.top = scale;
	name.verticalAlignment = 0;

	main.addControl(name);

	const slider = new GUI.Slider();
	slider.minimum = 0;
	slider.maximum = 100;
	slider.value = 0;
	slider.height = `${13 * scale}px`;
	slider.width = `${100 * scale}px`;
	slider.top = `${14 * scale}px`;
	slider.verticalAlignment = 0;
	slider.color = '#666666';
	slider.thumbColor = '#888888';
	slider.background = '#ffffffaa';
	slider.borderColor = '#00000000';
	slider.barOffset = 6;

	main.addControl(slider);

	const rescale = (x) => {
		main.height = `${28 * scale}px`;
		name.fontSize = 9 * scale;
		slider.height = `${13 * scale}px`;
		slider.width = `${100 * scale}px`;
		slider.top = `${14 * scale}px`;
	};

	event.on('scale-change', rescale);

	main.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return { main, name, slider };
}

export function createCheckbox() {
	const main = new GUI.Rectangle();
	main.height = `${12 * scale}px`;
	main.adaptWidthToChildren = true;
	main.isPointerBlocker = true;
	main.thickness = 0;

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 9 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Checkbox';
	name.top = scale;
	name.verticalAlignment = 0;
	name.width = `${100 * scale}px`;

	main.addControl(name);

	let isChecked = false;

	const rescale = (x) => {
		main.height = `${12 * scale}px`;
		name.fontSize = 9 * scale;
		name.width = `${100 * scale}px`;
	};

	event.on('scale-change', rescale);

	main.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return { main, name, isChecked };
}


export function createButton(width: number = 64, callback?: () => any) {
	const button = new GUI.Rectangle();
	button.height = `${17 * scale}px`;
	button.width = `${width * scale}px`;
	button.verticalAlignment = 0;
	button.horizontalAlignment = 0;
	button.thickness = 0;
	button.background = '#4d4d4daa';
	button.color = '#666666';

	const buttonText = new FormTextBlock();
	buttonText.text = [{ text: 'Text', color: 'white', font: 'Lato' }];
	buttonText.textHorizontalAlignment = 2;
	buttonText.fontSize = 6 * scale;
	buttonText.onPointerEnterObservable.add((e) => {
		buttonText.text.forEach((x) => (x.underline = true));
		buttonText._markAsDirty();
	});
	buttonText.onPointerOutObservable.add((e) => {
		buttonText.text.forEach((x) => (x.underline = false));
		buttonText._markAsDirty();
	});

	button.addControl(buttonText)

	if (callback) {
		button.onPointerClickObservable.add(callback);
	}

	const rescale = (x) => {
		button.height = `${17 * scale}px`;
		button.width = `${width * scale}px`;
		buttonText.fontSize = 6 * scale;
	};

	event.on('scale-change', rescale);

	button.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});


	return {button, buttonText}
}