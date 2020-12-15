import { isMobile, isFirefox } from 'mobile-device-detect';
import Engine from 'noa-engine';
import { setupControls } from './lib/player';
import { defineModelComp } from './lib/model';

import { noaOpts, updateSettings, serverSettings, defaultFonts, setNoa, updateServerSettings, gameSettings } from './values';
import { constructScreen } from './gui/main';

import { MPSocket } from './socket';
import { getSettings } from './lib/storage';
import { setupClouds } from './lib/sky';
import { buildMainMenu } from './gui/menu/main';
import { connect } from './lib/connect';
import { setupMobile } from './gui/mobile';
import { setupGamepad } from './lib/gamepad';
import { warningFirefox } from './gui/warnings';
import { chunkExist, event as worldEvent, getChunkSync } from './lib/world';

import * as ndarray from 'ndarray';
import { spawn, Worker } from 'threads';

spawn(new Worker('./inflate.js')).then((x) => {
	window['inflate'] = x;
});

defaultFonts.forEach((font) => document.fonts.load(`10pt "${font}"`));

getSettings().then((data) => updateSettings(data));

// @ts-ignore

const noa: any = new Engine(noaOpts());

//noa.world.maxChunksPendingCreation = Infinity;

noa.ents.createComponent({
	name: 'inventory',
	state: { items: {}, selected: 0, tempslot: {}, armor: {}, crafting: {} },
});

setNoa(noa);

noa.ents.getPhysics(noa.playerEntity).body.airDrag = 9999;
constructScreen(noa);
setupClouds(noa);
defineModelComp(noa);

setupControls(noa);
setupGamepad(noa);
//setupSkybox(noa)

noa.world.on('worldDataNeeded', async (id: string) => {
	const ida = id.split('|');

	const chunk = getChunkSync(`${ida[0]}|${ida[1]}|${ida[2]}`);
	if (chunk != null) {
		noa.world.setChunkData(id, chunk);
	}
});

let x = 0;
noa.on('beforeRender', async () => {
	if (!serverSettings.ingame) {
		x++;
		noa.camera.heading = x / 2000;
		noa.camera.pitch = 0;
	}
});

document.addEventListener(
	'pointerlockchange',
	() => {
		if (document.pointerLockElement == noa.container.canvas) {
			noa.ignorePointerLock = true;
			noa.ents.getState(noa.playerEntity, 'receivesInputs').ignore = false;
		} else {
			noa.ignorePointerLock = false;
			noa.ents.getState(noa.playerEntity, 'receivesInputs').ignore = true;
		}
	},
	false
);

setInterval(async () => {
	const pos = noa.ents.getPosition(noa.playerEntity);
	const ci = Math.ceil(pos[0] / 32);
	const cj = Math.ceil(pos[1] / 32);
	const ck = Math.ceil(pos[2] / 32);

	const add = Math.ceil(noa.world.chunkAddDistance);
	let i, j, k;

	for (i = ci - add; i <= ci + add; ++i) {
		for (j = cj - add; j <= cj + add; ++j) {
			for (k = ck - add; k <= ck + add; ++k) {
				if (noa.world._chunksKnown.includes(i, j, k)) continue;

				if (chunkExist([i, j, k].join('|'))) {
					noa.world.manuallyLoadChunk(i * 32, j * 32, k * 32);
				}
			}
		}
	}

	setTimeout(() => {
		//const remDistSq =  * noa.world.chunkRemoveDistance;
		const dist = noa.world.chunkRemoveDistance

		noa.world._chunksKnown.forEach((loc) => {
			if (noa.world._chunksToRemove.includes(loc[0], loc[1], loc[2])) return;
			var di = loc[0] - ci;
			var dj = loc[1] - cj;
			var dk = loc[2] - ck;
			if (dist <= Math.abs(di) || dist <= Math.abs(dj) || dist <= Math.abs(dk) ) noa.world.manuallyUnloadChunk(loc[0] * 32, loc[1] * 32, loc[2] * 32);
		});
	}, 500);
}, 2000);

window.onerror = function (msg, url, lineNo, columnNo, error) {
	alert(`${msg}\nPlease report this error at: https://github.com/VoxelSrv/voxelsrv/issues`);
};

window['connect'] = (x) => {
	connect(noa, new MPSocket(x));
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
