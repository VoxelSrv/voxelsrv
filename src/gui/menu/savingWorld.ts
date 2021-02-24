import { scale, event, getScreen } from '../main';
import * as GUI from '@babylonjs/gui/';
import { defaultValues } from '../../values';

export default function buildSavingWorld() {
	document.title = 'VoxelSrv - Saving world...';

	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	menu.height = `${120 * scale}px`;
	menu.width = `${180 * scale}px`;
	menu.background = defaultValues.menuColor;

	getScreen(2).addControl(menu);

	const status = new GUI.TextBlock();
	status.fontFamily = 'Lato';
	status.fontSize = 9 * scale;
	status.textVerticalAlignment = 2;
	status.color = 'white';
	status.text = 'Saving world...';
	status.textWrapping = GUI.TextWrapping.WordWrap;

	menu.addControl(status);

	const rescale = (x) => {
		menu.height = `${120 * scale}px`;
		menu.width = `${180 * scale}px`;

		status.fontSize = 9 * scale;
	};

	event.on('scale-change', rescale);

	menu.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return { screen: menu };
}
