import { isMobile } from 'mobile-device-detect';

import { scale, event, getScreen } from '../main';
import { FormTextBlock, IFormatedText } from '../parts/formtextblock';

import * as GUI from '@babylonjs/gui';

export let input: GUI.InputText;
export let chatContainer: GUI.StackPanel;
export let messages: Array<FormTextBlock> = [];
let height = 0;

let active = false;

export function changeState(state: boolean) {
	active = state;
}

export function setupChat() {
	height = 0;
	input = new GUI.InputText();
	
	while (messages.length != 0) {
		messages[0].dispose();
		messages.shift();
	}

	input.width = 100;
	input.horizontalAlignment = 0;
	input.verticalAlignment = 1;
	input.zIndex = 10;
	input.height = '36px';
	input.color = 'white';
	input.background = '#111111aa';
	input.focusedBackground = '#111111bb';
	input.thickness = 0;
	input.isVisible = false;
	input.shadowColor = '';
	input.fontSize = '32';
	input.promptMessage = 'Enter chat message';
	getScreen(2).addControl(input);

	chatContainer = new GUI.StackPanel();
	if (isMobile) {
		chatContainer.verticalAlignment = 0;
		chatContainer.horizontalAlignment = 1;
		chatContainer.width = `${140 * scale}px`;
	} else {
		chatContainer.verticalAlignment = 1;
		chatContainer.horizontalAlignment = 0;
		chatContainer.top = `${-26 * scale}px`;
		chatContainer.width = `${176 * scale}px`;
	}
	chatContainer.name = 'textContainer';
	chatContainer.useBitmapCache = true;
	chatContainer.zIndex = 10;
	chatContainer.background = '#11111177';
	chatContainer.height = 0;

	getScreen(1).addControl(chatContainer);

	const scaleEvent = (x) => {
		if (isMobile) {
			chatContainer.width = `${140 * scale}px`;
		} else {
			chatContainer.top = `${-26 * x}px`;
			chatContainer.width = `${176 * x}px`;
		}

		messages.forEach((message) => {
			message.fontSize = 8 * x;
			message.paddingLeft = `${2 * x}px`;
			if (isMobile) message.width = `${140 * x}px`;
			else message.width = `${176 * x}px`;
			message.height = `${message.computeExpectedHeight()}px`;
		});

		calcHeight();
	};

	event.on('scale-change', scaleEvent);

	const z = setInterval(async () => {
		if (active) {
			let x = 0;
			messages.forEach((m) => {
				if (m.shouldhide && !m.isVisible) {
					m.isVisible = true;
					x = x + 1;
				}
			});
			if (x != 0) calcHeight();
		} else {
			let x = 0;
			messages.forEach((m) => {
				if (m.shouldhide && m.isVisible) m.isVisible = false;
				x = x + 1;
			});
			if (x != 0) calcHeight();
		}
	}, 100);

	chatContainer.onDisposeObservable.add(() => {
		clearInterval(z);

		while (messages.length != 0) {
			messages[0].dispose();
			messages.shift();
		}

		height = 0;
		event.off('scale-change', scaleEvent);
	});
}

export async function addMessage(msg) {
	const data: Array<IFormatedText> = Object.values(msg);
	let x = '';
	data.forEach((y) => {
		x = x + y.text;
	});

	const message = new FormTextBlock();
	message.fontSize = 8 * scale;
	message.paddingLeft = `${2 * scale}px`;
	message.textVerticalAlignment = 1;
	message.textHorizontalAlignment = 0;
	message.fontFamily = 'Lato';
	message.color = 'white';
	if (isMobile) message.width = `${140 * scale}px`;
	else message.width = `${176 * scale}px`;
	message.zIndex = 11;

	message.text = data;
	message.height = `${message.computeExpectedHeight()}px`;
	message.useBitmapCache = true;

	messages.unshift(message);

	chatContainer.addControl(message);

	while (messages.length > 50) {
		messages[messages.length - 1].dispose();
		messages.pop();
	}

	setInterval(async () => {
		message.shouldhide = true;
		if (!active) message.isVisible = false;
		calcHeight();
	}, 8000);

	calcHeight();
	console.log('Chat: ' + x);
}

function calcHeight() {
	height = 0;
	messages.forEach((m) => {
		if (!active && m.isVisible && height > 200 * scale) {
			m.shouldhide = true;
			m.isVisible = false;
		} else if (m.isVisible) {
			height = height + m.heightInPixels;
		}
	});

	if (height != 0) {
		chatContainer.height = `${height + 5}px`;
		chatContainer.isVisible = true;
	} else if (chatContainer.isVisible) chatContainer.isVisible = false;
}
