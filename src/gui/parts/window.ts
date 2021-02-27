import * as GUI from '@babylonjs/gui/';
import { IFormatedText, FormTextBlock } from './formtextblock';
import { scale, event, getScreen } from '../main';

export function createWindow(x: number, y: number, title: string | Array<IFormatedText>, movable: boolean): WindowObject {
	const ui = getScreen(1);

	const window = new GUI.Rectangle();
	window.width = `${x * scale}px`;
	window.height = `${y * scale}px`;
	window.zIndex = 1000;
	window.thickness = 0;
	window.verticalAlignment = 0;
	window.horizontalAlignment = 0;
	window.background = '#EEEEEEDB';

	let clicked = false;

	let startingPoint = [];
	let windowStart = [window.leftInPixels, window.topInPixels];

	const bar = new GUI.Rectangle();
	bar.width = `${x * scale}px`;
	bar.height = `${12 * scale}px`;
	bar.thickness = 0;
	bar.background = '#2b2b2bed';
	bar.verticalAlignment = 0;

	if (movable) {
		bar.onPointerDownObservable.add((data) => {
			clicked = true;
			startingPoint = [data.x, data.y];
			windowStart = [window.leftInPixels, window.topInPixels];
			console.log(1)
		});

		bar.onPointerUpObservable.add(() => {
			console.log(0)
			clicked = false;
		});

		const obs = ui.onPointerMoveObservable.add((data) => {
			if (!clicked) return;
			window.left = -(startingPoint[0] - data.x) + windowStart[0];
			window.top = -(startingPoint[1] - data.y) + windowStart[1];
		});

		window.onDisposeObservable.add(() => {
			ui.onPointerMoveObservable.remove(obs);
		});
	}

	window.addControl(bar);

	const text = new FormTextBlock();
	text.fontSize = `${6.5 * scale}px`;
	if (typeof title == 'string') text.text = [{ text: title, color: 'white' }];
	else text.text = title;
	bar.addControl(text);

	const close = new GUI.Ellipse();
	close.width = `${7 * scale}px`;
	close.height = `${7 * scale}px`;
	close.left = `${-2 * scale}px`;
	close.thickness = 0;
	close.isPointerBlocker = true;
	close.zIndex = 200;
	close.background = '#DD4444AE';
	close.verticalAlignment = 2;
	close.horizontalAlignment = 1;
	close.onPointerClickObservable.add(() => {
		window.dispose();
	});
	bar.addControl(close);

	const main = new GUI.Rectangle();
	main.top = `${12 * scale}px`;
	main.width = `${x * scale}px`;
	main.height = `${(y - 12) * scale}px`;
	main.thickness = 0;
	main.verticalAlignment = 0;

	window.addControl(main);

	const rescale = (x) => {
		main.top = `${12 * scale}px`;
		main.width = `${x * scale}px`;
		main.height = `${(y - 12) * scale}px`;

		close.width = `${7 * scale}px`;
		close.height = `${7 * scale}px`;
		close.left = `${-2 * scale}px`;

		bar.width = `${x * scale}px`;
		bar.height = `${12 * scale}px`;

		window.width = `${x * scale}px`;
		window.height = `${y * scale}px`;
	};

	return { main: main, bar: bar, text: text, window: window };
}



export type WindowObject = { main: GUI.Rectangle, bar: GUI.Rectangle, text: FormTextBlock, window: GUI.Rectangle }
