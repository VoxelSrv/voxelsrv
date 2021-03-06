import { isMobile } from 'mobile-device-detect';
import Engine2, { Engine } from 'noa-engine';
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { rebindControls, setupControls } from './lib/player/controls';
import { defineModelComp } from './lib/helpers/model';

import {
	noaOpts,
	updateSettings,
	serverSettings,
	defaultFonts,
	setNoa,
	updateServerSettings,
	IGameSettings,
	defaultValues,
	gameSettings,
	gameVersion,
	singleplayerWorldTypes,
	singleplayerServerInfo,
	setAuthInfo,
} from './values';
import { constructScreen, getScreen } from './gui/main';

import { getAuthData, getSettings } from './lib/helpers/storage';
import { setupClouds, setupSky } from './lib/gameplay/sky';
import { buildMainMenu } from './gui/menu/main';
import { connect, setupConnection } from './lib/gameplay/connect';
import { setupMobile } from './gui/mobile';
import { setupGamepad } from './lib/player/gamepad';
import { createInflateWorker, setupWorld } from './lib/gameplay/world';

import { setupToasts } from './gui/parts/toastMessage';
import { createProtocolWorker } from './socket';
import { PopupGUI } from './gui/parts/miniPopupHelper';
import { createSingleplayerServer } from './lib/singleplayer/setup';

defaultFonts.forEach((font) => document.fonts.load(`10pt "${font}"`));

getSettings().then(async (data: IGameSettings) => {
	updateSettings(data);
	// @ts-ignore
	const tempNoa = new Engine2(noaOpts());

	const noa: Engine = tempNoa;
	constructScreen(noa);

	const loading = new PopupGUI([{ text: 'Loading...' }]);
	loading.setCenterText([{ text: 'Starting...' }]);
	getScreen(2).addControl(loading.main);

	const canvas: HTMLCanvasElement = noa.container.canvas;

	canvas.onwheel = function (event) {
		event.preventDefault();
	};

	window.addEventListener('beforeunload', function (e) {
		e.preventDefault();
		e.returnValue = '';
	});

	canvas.addEventListener('keydown', (e) => {
		if (e.key == ' ') {
			e.preventDefault();
		}
	});

	rebindControls(noa, data.controls);

	noa.world.maxChunksPendingCreation = Infinity;

	noa.ents.createComponent({
		name: 'inventory',
		state: { items: {}, selected: 0, tempslot: {}, armor: {}, crafting: {} },
	});

	setNoa(noa);

	noa.ents.getPhysics(noa.playerEntity).body.airDrag = 9999;
	setupToasts();
	setupClouds(noa);
	setupSky(noa);
	defineModelComp(noa);

	const scene = noa.rendering.getScene();

	scene.fogMode = defaultValues.fogMode;
	scene.fogStart = defaultValues.fogStart;
	scene.fogEnd = defaultValues.fogEnd;
	scene.fogDensity = defaultValues.fogDensity;
	scene.fogColor = new BABYLON.Color3(...defaultValues.fogColor);

	setupControls(noa);
	setupGamepad(noa);

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
			if (!isMobile) {
				if (document.pointerLockElement == noa.container.canvas) {
					noa.ignorePointerLock = true;
					noa.ents.getState(noa.playerEntity, 'receivesInputs').ignore = false;
				} else {
					noa.ignorePointerLock = false;
					noa.ents.getState(noa.playerEntity, 'receivesInputs').ignore = true;
				}
			} else {
			}
		},
		false
	);

	loading.setCenterText([{ text: 'Creating workers...' }]);
	await createProtocolWorker();
	await createInflateWorker();
	loading.setCenterText([{ text: 'Checking login data...' }]);
	setAuthInfo(await getAuthData(), false);
	loading.setCenterText([{ text: 'Finishing...' }]);

	window['connect'] = (x) => {
		connect(noa, x);
	};

	window['enableDebugSettings'] = () => {
		gameSettings.debugSettings.makeSettingsVisible = true;
	};

	window['forceplay'] = () => {
		updateServerSettings({ ingame: true });
	};

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

	loading.dispose();
	if (!!options.get('server')) {
		connect(noa, options.get('server'));
	} if (options.get('debugWorld') != undefined) {
		const socket = createSingleplayerServer('debugWorld', {
			gamemode: 'creative',
			gameVersion: gameVersion,
			serverVersion: '',
			worldsize: 32,
			version: 0,
			seed: 2021,
			generator: singleplayerWorldTypes[0],
			icon: 'voxelsrv',
			displayName: 'debugWorld'
		}, true);

		setupConnection(noa, socket, {...singleplayerServerInfo, motd: 'debugWorld' });
	} else {
		buildMainMenu(noa);
	}
});
