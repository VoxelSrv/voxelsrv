import { scale, event, getScreen } from '../main';
import { FormTextBlock, IFormatedText } from '../parts/formtextblock';

import * as GUI from '@babylonjs/gui';
import { messages } from '../ingame/chat';

export let toastContainer: GUI.StackPanel;

export function setupToasts() {
	toastContainer = new GUI.StackPanel();
	toastContainer.verticalAlignment = 0;
	toastContainer.horizontalAlignment = 1;
	toastContainer.name = 'textContainer';
	toastContainer.useBitmapCache = true;
	toastContainer.width = `${120 * scale}px`;
	toastContainer.zIndex = 1000;
	toastContainer.isPointerBlocker = false;
	toastContainer.isHitTestVisible = false;
	toastContainer.left = -1 * scale;


	const scaleEvent = (x) => {
		toastContainer.width = `${120 * scale}px`;
		toastContainer.top = scale;
		toastContainer.left = -1 * scale;
	};

	event.on('scale-change', scaleEvent);

	getScreen(2).addControl(toastContainer);
}

export async function addToast(name: IFormatedText[], text: IFormatedText[], color: string, time: number) {
	const main = new GUI.Rectangle();
	main.thickness = 0;
	main.width = `${120 * scale}px`;
	main.height = `${30 * scale}px`;
	main.top = scale;
	main.background = color;
	main.isPointerBlocker = false;
	main.isHitTestVisible = false;

	const title = new FormTextBlock();
	title.text = name;
	title.fontFamily = 'lato';
	title.color = 'white';
	title.fontSize = 10 * scale;
	title.textHorizontalAlignment = 0;
	title.textVerticalAlignment = 0;
	title.left = 5 * scale;

	main.addControl(title);

	const message = new FormTextBlock();
	message.text = text;
	message.fontFamily = 'lato';
	message.color = 'white';
	message.fontSize = 6 * scale;
	message.textHorizontalAlignment = 0;
	message.textVerticalAlignment = 0;
	message.top = 13 * scale;
	message.left = 5 * scale;

	main.addControl(message);

	const scaleEvent = (x) => {
		message.fontSize = 6 * scale;
		message.top = 13 * scale;
		main.top = scale;
		title.fontSize = 10 * scale;
		main.width = `${120 * scale}px`;
		main.height = `${30 * scale}px`;
		message.left = 5 * scale;
		title.left = 5 * scale;
	};

	event.on('scale-change', scaleEvent);

	main.onDisposeObservable.add(() => {
		event.off('scale-change', scaleEvent);
	});

	setTimeout(() => {
		main.dispose();
		toastContainer.removeControl(main);
	}, time * 1000);

	toastContainer.addControl(main);
}

export const toastColors = {
	error: '#b50c0099',
	message: '#5c5c5c99',
};
