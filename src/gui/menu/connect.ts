import { scale, event, getUI, getScreen } from '../main';
import * as GUI from '@babylonjs/gui/';
import { createItem } from '../../gui-uni/menu';
import { disconnect } from '../../lib/connect';

export default function buildConnect() {
	document.title = 'VoxelSrv - Connecting...';

	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	menu.height = `${120 * scale}px`;
	menu.width = `${180 * scale}px`;
	menu.background = '#11111166';

	getScreen(2).addControl(menu);

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 10 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.top = scale;

	menu.addControl(name);

	const motd = new GUI.TextBlock();
	motd.fontFamily = 'Lato';
	motd.fontSize = 9 * scale;
	motd.top = `${14 * scale}px`
	motd.textVerticalAlignment = 0;
	motd.color = 'white';

	menu.addControl(motd);

	const status = new GUI.TextBlock();
	status.fontFamily = 'Lato';
	status.fontSize = 9 * scale;
	status.textVerticalAlignment = 2;
	status.color = 'white';
	status.text = 'Logging in...'
	status.textWrapping = GUI.TextWrapping.WordWrap;

	menu.addControl(status);

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Disconnect', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		menu.dispose();
		disconnect();
	});
	menu.addControl(back.item);

	const rescale = (x) => {
		menu.height = `${120 * scale}px`;
		menu.width = `${180 * scale}px`;

		name.fontSize = 11 * scale;
		motd.fontSize = 11 * scale;
		motd.top = `${14 * scale}px`

		status.fontSize = 9 * scale;

		back.item.width = `${100 * scale}px`;
		back.item.height = `${18 * scale}px`;
		back.text.fontSize = 10 * scale;
	};

	event.on('scale-change', rescale);

	menu.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return { menu, name, motd, status};
}
