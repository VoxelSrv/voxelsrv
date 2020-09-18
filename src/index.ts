import { isMobile } from 'mobile-device-detect';
import Engine from 'noa-engine';
import { setupControls } from './lib/player';
import { defineModelComp } from './lib/model';

import { noaOpts, updateSettings, serverSettings, defaultFonts, setNoa, updateServerSettings } from './values';
import { constructScreen } from './gui/main';

import { Socket } from './socket';
import { getSettings } from './lib/storage';
import { setupClouds } from './lib/sky';
import { buildMainMenu } from './gui/menu/main';
import { connect } from './lib/connect';
import { setupMobile } from './gui/mobile';
import { setupGamepad } from './lib/gamepad';

defaultFonts.forEach((font) => document.fonts.load(`10pt "${font}"`));

getSettings().then((data) => updateSettings(data));

const noa: any = new Engine(noaOpts());

noa.ents.createComponent({
	name: 'inventory',
	state: { items: {}, selected: 0, tempslot: {}, armor: {} },
});

setNoa(noa);

noa.ents.getPhysics(noa.playerEntity).body.airDrag = 9999;
constructScreen(noa);
setupClouds(noa);
defineModelComp(noa);

setupControls(noa);
setupGamepad(noa);
//setupSkybox(noa)

let x = 0;
noa.on('beforeRender', async () => {
	if (!serverSettings.ingame) {
		x++;
		noa.camera.heading = x / 2000;
		noa.camera.pitch = 0;
	}
});

window['connect'] = (x) => {
	connect(noa, new Socket(x));
};

window['forceplay'] = () => {
	updateServerSettings({ ingame: true });
};

window.onload = function () {
	if (isMobile) {
		setupMobile(noa);
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'mobile.css';
		document.head.appendChild(link);
		document.documentElement.addEventListener('click', function () {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen();
				screen.orientation.lock('landscape');
			}
		});
	}

	// Default actions
	const options = new URLSearchParams(window.location.search);

	if (!!options.get('server')) {
		const socket = new Socket('ws://' + options.get('server'));
		connect(noa, socket);
	} else {
		setTimeout(() => {
			buildMainMenu(noa);
		}, 50);
	}
};
