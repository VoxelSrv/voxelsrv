import { isMobile, isFirefox } from 'mobile-device-detect';
import Engine from 'noa-engine';
import { setupControls } from './lib/player';
import { defineModelComp } from './lib/model';

import { noaOpts, updateSettings, serverSettings, defaultFonts, setNoa, updateServerSettings, gameSettings } from './values';
import { constructScreen } from './gui/main';

import { MPSocket, PeerSocket } from './socket';
import { getSettings } from './lib/storage';
import { setupClouds } from './lib/sky';
import { buildMainMenu } from './gui/menu/main';
import { connect } from './lib/connect';
import { setupMobile } from './gui/mobile';
import { setupGamepad } from './lib/gamepad';
import { warningFirefox } from './gui/warnings';
import { event as worldEvent, getChunkSync } from './lib/world';

import * as ndarray from 'ndarray';
import { spawn, Worker } from 'threads';

spawn(new Worker('./lib/worldInflate')).then((x) => {
	window['inflate'] = x;
});

defaultFonts.forEach((font) => document.fonts.load(`10pt "${font}"`));

getSettings().then((data) => updateSettings(data));

// @ts-ignore

const noa: any = new Engine(noaOpts());

noa.ents.createComponent({
	name: 'inventory',
	state: { items: {}, selected: 0, tempslot: {}, armor: {}, crafting: {} },
});

setNoa(noa);

noa.ents.getPhysics(noa.playerEntity).body.airDrag = 9999;
noa.world.maxChunksPendingCreation = Infinity;
constructScreen(noa);
setupClouds(noa);
defineModelComp(noa);

setupControls(noa);
setupGamepad(noa);
//setupSkybox(noa)

const chunkLoadArray: [number, number, number][] = []

noa.world.on('worldDataNeeded', async (id: string) => {
	const ida = id.split('|');
	id = `${ida[0]}|${ida[1]}|${ida[2]}`;

	const out = loadChunk(id)
	if (!out) {
		const x = parseInt(ida[0]),
			y = parseInt(ida[1]),
			z = parseInt(ida[2]);

		
		if (!noa.world._chunksPending.includes(x, y, z)) return;
		chunkLoadArray.push([x, y, z])
	}
});

setInterval(()=> {
	if (chunkLoadArray.length == 0) return;

	const [x, y, z] = chunkLoadArray.shift();

	if (!noa.world._chunksPending.includes(x, y, z)) return;
	const out = loadChunk([x, y, z].join('|'))
	if (!out) {
		chunkLoadArray.push([x, y, z])
	}

}, 8)

function loadChunk(id) {
	const chunk = getChunkSync(id);
	if (chunk != null) {
		noa.world.setChunkData(id, chunk);
		return true
	}
	return false
}

let x = 0;
noa.on('beforeRender', async () => {
	if (!serverSettings.ingame) {
		x++;
		noa.camera.heading = x / 2000;
		noa.camera.pitch = 0;
	}
});

/*worldEvent.on('load', (id, chunk) => {
	noa.world.setChunkData(id.join('|'), chunk)
})*/

window.onerror = function (msg, url, lineNo, columnNo, error) {
	alert(`${msg}\nPlease report this error at: https://github.com/VoxelSrv/voxelsrv/issues`);
};

window['connect'] = (x) => {
	connect(noa, new MPSocket(x));
};

window['peer'] = (x) => {
	connect(noa, new PeerSocket(x));
};

window['forceplay'] = () => {
	updateServerSettings({ ingame: true });
};

setTimeout(() => {
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
	if (isFirefox) {
		warningFirefox();
	}

	// Default actions
	const options = new URLSearchParams(window.location.search);

	if (!!options.get('server')) {
		const socket = new MPSocket('ws://' + options.get('server'));
		connect(noa, socket);
	} else if (!!options.get('peer')) {
		const socket = new PeerSocket(options.get('peer'));
		connect(noa, socket);
	} else {
		setTimeout(() => {
			buildMainMenu(noa);
		}, 50);
	}

	if (window['electron'] != undefined) {
		window['electron'].on('world-started', (e, port) => {
			connect(noa, new MPSocket(`ws://localhost:${port}`));
		});
	}
}, 1000);
