import { isMobile, isFirefox } from 'mobile-device-detect';
import Engine from 'noa-engine';
import { rebindControls, setupControls } from './lib/player/controls';
import { defineModelComp } from './lib/helpers/model';

import { noaOpts, updateSettings, serverSettings, defaultFonts, setNoa, updateServerSettings, gameSettings, gameProtocol, IGameSettings } from './values';
import { constructScreen } from './gui/main';

import { MPSocket } from './socket';
import { getSettings } from './lib/helpers/storage';
import { setupClouds } from './lib/gameplay/sky';
import { buildMainMenu } from './gui/menu/main';
import { connect, setupConnection } from './lib/gameplay/connect';
import { setupMobile } from './gui/mobile';
import { setupGamepad } from './lib/player/gamepad';
import { warningFirefox } from './gui/warnings';
import { setupWorld } from './lib/gameplay/world';

import { spawn, Worker } from 'threads';
import { createSingleplayerServer } from './lib/singleplayer/setup';
import { IServerInfo } from './gui/menu/multiplayer';

spawn(new Worker('./inflate.js')).then((x) => {
	window['inflate'] = x;
});

defaultFonts.forEach((font) => document.fonts.load(`10pt "${font}"`));

getSettings().then((data: IGameSettings) => {
	updateSettings(data);
	// @ts-ignore
	const noa: any = new Engine(noaOpts());

	rebindControls(noa, data.controls);

	noa.world.maxChunksPendingCreation = Infinity;

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

	setupWorld(noa);

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
			if (document.pointerLockElement == noa.container.canvas || isMobile) {
				noa.ignorePointerLock = true;
				noa.ents.getState(noa.playerEntity, 'receivesInputs').ignore = false;
			} else {
				noa.ignorePointerLock = false;
				noa.ents.getState(noa.playerEntity, 'receivesInputs').ignore = true;
			}
		},
		false
	);

	window.onerror = function (msg, url, lineNo, columnNo, error) {
		alert(`${msg}\nPlease report this error at: https://github.com/VoxelSrv/voxelsrv/issues`);
	};

	window['connect'] = (x) => {
		connect(noa, x);
	};

	window['singleplayerTest'] = () => {
		const info: IServerInfo = {
			name: 'Singleplayer World',
			ip: 'Internal',
			motd: '',
			protocol: gameProtocol,
			software: 'VoxelSrv',
			featured: true,
			icon: 'voxelsrv',
			type: 0,
			players: {
				max: 1,
				online: 0,
			},
			useProxy: false,
		};
		setupConnection(noa, createSingleplayerServer(), info);
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
			connect(noa, options.get('server'));
		} else {
			setTimeout(() => {
				buildMainMenu(noa);
			}, 50);
		}
	}, 1000);
});
