import { scale, event, getScreen } from './main';
import { FormTextBlock, IFormatedText } from './parts/formtextblock';

import * as GUI from '@babylonjs/gui';

export let input: GUI.InputText;
export let tabContainer: GUI.StackPanel;
export let messages: Array<FormTextBlock> = [];
let height = 0;


export function setupTab() {
	const ui = getScreen(2);

	tabContainer = new GUI.StackPanel();
	tabContainer.verticalAlignment = 2;
	tabContainer.horizontalAlignment = 2;
	tabContainer.width = `${180 * scale}px`;
	tabContainer.name = 'textContainer';
	tabContainer.useBitmapCache = true;
	tabContainer.zIndex = 100;
	tabContainer.background = '#11111155';

	ui.addControl(tabContainer);

	const scaleEvent = (x) => {
		tabContainer.width = `${180 * scale}px`;

		messages.forEach((message) => {
			message.fontSize = 8 * x;
			message.paddingLeft = `${2 * x}px`;
			message.width = `${176 * x}px`;
			message.height = `${message.computeExpectedHeight()}px`;
		});

		calcHeight();
		tabContainer.isVisible = false;
	};

	event.on('scale-change', scaleEvent);

	tabContainer.onDisposeObservable.add(() => {
		messages.forEach((m) => m.dispose());
		messages = [];
		height = 0;
		event.off('scale-change', scaleEvent);
	});

	tabContainer.isVisible = false;
}

export async function setTab(msg) {
	messages.forEach((message) => message.dispose());
	messages = [];
	const data: IFormatedText[] = Object.values(msg);
	let x = '';
	data.forEach((y) => {
		x = x + y.text;
	});

	const message = new FormTextBlock();
	message.fontSize = 8 * scale;
	message.paddingLeft = `${2 * scale}px`;
	message.textVerticalAlignment = 1;
	message.textHorizontalAlignment = 2;
	message.fontFamily = 'Lato';
	message.width = `${176 * scale}px`;

	message.text = data;
	message.height = `${message.computeExpectedHeight()}px`;
	message.useBitmapCache = true;

	messages.unshift(message);

	tabContainer.addControl(message);

	calcHeight();
}

function calcHeight() {
	height = 0;
	messages.forEach((m) => {
		height = height + m.heightInPixels;
	});

	if (height != 0) {
		tabContainer.height = `${height + 5}px`;
	}
}
