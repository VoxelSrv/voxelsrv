import * as GUI from '@babylonjs/gui';

import { createItem } from '../gui-uni/menu';
import { createWindow } from '../gui-uni/window';
import { getScreen } from './main';

export function warningFirefox() {
	const warning = createWindow(200, 100, 'Warning!', false);

	const text = new GUI.TextBlock();
	text.text = `Warning. Firefox might have performance issues. For the best performance, you should use Chromium(-based) browser.
				I know you aren't too happy about it, but I can't do much about it.`;
	text.textWrapping = 1;
	text.fontSize = 20;
	text.color = '#111111';
	text.textVerticalAlignment = 0;
	warning.main.paddingTop = 10;
	warning.main.paddingRight = 10;
	warning.main.paddingLeft = 10;
	warning.main.paddingBottom = 10;

	warning.main.addControl(text);

	const okButton = createItem();

	okButton.item.verticalAlignment = 1;
	okButton.text.text = [{ text: 'Okay, let me play', color: '#222222' }];
	okButton.item.onPointerClickObservable.add(() => warning.window.dispose());

	warning.main.addControl(okButton.item);

	console.log('Firefox detected! Displaying warning!');
	warning.window.isVisible = true;
	warning.window.verticalAlignment = 2;
	warning.window.horizontalAlignment = 2;

	getScreen(1).addControl(warning.window);
}
