import { getLayer, getUI, ShadowText } from './main';

import * as GUI from '@babylonjs/gui';
import { gameVersion } from '../values';

export function setupDebug(noa, server) {
	const scene = getLayer(0);
	const ui = getUI(0);

	const eid = noa.playerEntity;
	const dat = noa.entities.getPositionData(eid);

	const debug = new ShadowText(100);
	ui.addControl(debug.main);
	ui.addControl(debug.shadow);

	debug.set('text', '');
	debug.main.color = '#f0f0f0';
	debug.shadow.color = '#111111';
	debug.set('fontSize', '24px');
	debug.main.left = '5px';
	debug.main.top = '5px';
	debug.shadow.left = `6px`;
	debug.shadow.top = `6px`;
	debug.set('textHorizontalAlignment', GUI.Control.HORIZONTAL_ALIGNMENT_LEFT);
	debug.set('textVerticalAlignment', GUI.Control.VERTICAL_ALIGNMENT_TOP);

	let serverText: string

	if (server != undefined) serverText = `Server: ${server}\n`
	else serverText = `Singleplayer world\n`

	noa.on('tick', async function () {
		const pos = `${dat.position[0].toFixed(1)}, ${dat.position[1].toFixed(1)}, ${dat.position[2].toFixed(1)}`;
		const text = `VoxelSrv ${gameVersion}\nNoa: ${noa.version}\nXYZ: ${pos}\n${serverText}`;
		debug.set('text', text);
	});
}

export function setupDot() {
	const scene = getLayer(0);
	const ui = getUI(0);

	const dot = new GUI.Ellipse();
	dot.background = '#eeeeee88';
	dot.height = '6px'
	dot.width = '6px'
	dot.thickness = 0;

	ui.addControl(dot)
}
