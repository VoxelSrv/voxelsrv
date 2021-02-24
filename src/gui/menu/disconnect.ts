import { scale, event, getUI, getScreen } from '../main';
import * as GUI from '@babylonjs/gui/';
import { buildMainMenu } from './main';
import { createItem } from '../parts/menu';
import { connect } from '../../lib/gameplay/connect';
import { defaultValues } from '../../values';
import { BaseSocket } from '../../socket';
import { Engine } from 'noa-engine';

export default function buildDisconnect(reasontext: string, socket: BaseSocket, noa: Engine) {
	document.title = 'VoxelSrv - Disconnected!';

	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	menu.height = `${120 * scale}px`;
	menu.width = `${180 * scale}px`;
	menu.background = defaultValues.menuColor;

	getScreen(2).addControl(menu);

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 11 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = socket.singleplayer ? '' : 'Disconnected!';
	name.top = scale;

	menu.addControl(name);

	const reason = new GUI.TextBlock();
	reason.fontFamily = 'Lato';
	reason.fontSize = 9 * scale;
	reason.textVerticalAlignment = 2;
	reason.color = 'white';
	reason.text = reasontext;
	reason.textWrapping = GUI.TextWrapping.WordWrap;

	menu.addControl(reason);

	const reconnect = createItem();
	reconnect.item.verticalAlignment = 1;
	reconnect.text.text = [{ text: 'Reconnect', color: 'white', font: 'Lato' }];
	reconnect.item.top = `-${16 * scale}px`;

	reconnect.item.onPointerClickObservable.add(() => {
		menu.dispose();
		connect(noa, socket.server);
	});

	if (!socket.singleplayer) {
		menu.addControl(reconnect.item);
	}

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Main menu', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		menu.dispose();
		buildMainMenu(noa);
	});
	menu.addControl(back.item);

	const rescale = (x) => {
		menu.height = `${120 * scale}px`;
		menu.width = `${180 * scale}px`;

		name.fontSize = 11 * scale;

		back.item.width = `${100 * scale}px`;
		back.item.height = `${18 * scale}px`;
		back.text.fontSize = 10 * scale;

		reconnect.item.width = `${100 * scale}px`;
		reconnect.item.height = `${18 * scale}px`;
		reconnect.text.fontSize = 10 * scale;
		reconnect.item.top = `-${16 * scale}px`;
	};

	event.on('scale-change', rescale);

	menu.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return menu;
}