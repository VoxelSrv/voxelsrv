import { defaultSettings, gameSettings, getAuthInfo, serverSettings, updateSettings } from '../../values';
import { isSingleplayer, socketSend } from '../../lib/gameplay/connect';
import { SettingsGUI } from '../parts/settingsHelper';
import * as GUI from '@babylonjs/gui/';
import { rebindControls } from '../../lib/player/controls';
import { isMobile } from 'mobile-device-detect';
import { checkAndLoadChunks } from '../../lib/gameplay/world';

export default function buildSettings(noa, openMenu, holder: GUI.Rectangle) {
	const main = new SettingsGUI('main', [{ text: 'Settings' }]);

	const auth = getAuthInfo();

	const nickname = main.createInput('nickname', 'Nickname', auth?.username || gameSettings.nickname, `Write your nickname`, 'Enter your nickname');
	if (auth != null) {
		nickname.input.addKey = false;
		nickname.input.onKeyboardEventProcessedObservable.add((x) => {
			nickname.input.text = auth.username;
		});
	}

	main.createSlider('scale', (v) => `GUI scale: ${v}`, gameSettings.scale, 2, 5, 1);
	main.createSlider('fov', (v) => `FOV: ${v}`, gameSettings.fov, 20, 120, 1);
	main.createSlider('viewDistance', (v) => `View Distance: ${v}`, gameSettings.viewDistance, 2, 16, 1);
	main.createSelectable('showFPS', (v) => `FPS Counter: ${disEn(v)}`, gameSettings.showFPS ? 1 : 0, [false, true]);
	main.createSelectable('debugInfo', (v) => `Debug information: ${disEn(v)}`, gameSettings.debugInfo ? 1 : 0, [false, true]);
	main.createSettingButton('Back', () => {
		const settings = main.settings;

		updateSettings({
			nickname: settings.nickname,
			scale: settings.scale,
			viewDistance: settings.viewDistance,
			fov: settings.fov,
			debugInfo: settings.debugInfo == 1,
			showFPS: settings.showFPS == 1,
		});

		const pos = noa.ents.getPosition(noa.playerEntity);

		noa.world.chunkAddDistance = [settings.viewDistance, settings.viewDistance];
		noa.world.chunkRemoveDistance = [settings.viewDistance + 0.5, settings.viewDistance + 0.5];
		checkAndLoadChunks(noa, Math.floor(pos[0] / 32), Math.floor(pos[1] / 32), Math.floor(pos[2] / 32));

		if (isSingleplayer()) {
			socketSend('SingleplayerViewDistance', { value: settings.viewDistance });
		}

		if (serverSettings.ingame) {
			noa.rendering.getScene().cameras[0].fov = (settings.fov * Math.PI) / 180;
		}

		main.main.dispose();
		openMenu('main');
	});

	main.createItem('account', 'Account settings...', () => {
		openMenu('login');
	});

	main.createItem('controls', 'Controls...', () => {
		main.main.isVisible = false;

		const controls = new SettingsGUI('main', [{ text: 'Controls...' }]);
		controls.createSlider('mouse', (v) => `Mouse sensitivity: ${v}`, gameSettings.mouse, 1, 80, 1);
		controls.createSelectable('gamepad', (v) => `Gamepad support: ${disEn(v)}`, gameSettings.gamepad ? 1 : 0, [false, true]);

		if (!isMobile) {
			controls.createLabel('keybinds', 'Keybinds');
			const reset = controls.createItem('reset-keys', 'Restore default keybinds');

			reset.item.onPointerClickObservable.add(() => {
				for (const action in defaultSettings.controls) {
					controls.setValue(`key-${action}`, defaultSettings.controls[action]);
				}
			});

			for (const action in gameSettings.controls) {
				if (['muteMusic', 'chatenter', 'thirdprsn', 'menu'].includes(action)) {
					continue;
				}

				controls.createKeybind(`key-${action}`, (v) => `${renameControls(action)}: [${v == null ? 'Press Key' : v}]`, gameSettings.controls[action]);
			}
		}

		holder.addControl(controls.main);

		controls.createSettingButton('Back', () => {
			const controllist = { ...gameSettings.controls };

			for (const i in controls.settings) {
				if (i.startsWith('key-')) {
					controllist[i.substring(4)] = controls.settings[i];
				}
			}

			updateSettings({
				mouse: controls.settings.mouse,
				gamepad: controls.settings.gamepad == 1,
				controls: controllist,
			});

			rebindControls(noa, controllist);

			noa.camera.sensitivityX = controls.settings.mouse;
			noa.camera.sensitivityY = controls.settings.mouse;
			controls.main.dispose();
			main.main.isVisible = true;
		});
	});

	if (gameSettings.debugSettings.makeSettingsVisible) {
		const controlsButton = main.createItem('debug', 'Debug [☣]');

		controlsButton.item.onPointerClickObservable.add(() => {
			main.main.isVisible = false;

			const typeMap = {};

			const debug = new SettingsGUI('debug', [{ text: 'Debug [☣]' }]);

			for (const action in gameSettings.debugSettings) {
				typeMap[action] = typeof gameSettings.debugSettings[action];

				switch (typeMap[action]) {
					case 'boolean':
						debug.createSelectable(action, (v) => `${action}: ${disEn(v)}`, gameSettings.debugSettings[action] ? 1 : 0, [false, true]);
						break;
					default:
						console.log(`Can't create field for ${action} (${typeMap[action]})`);
				}
			}

			debug.createSettingButton('Back', () => {
				const debugSettings = { ...gameSettings.debugSettings };

				for (const i in debug.settings) {
					switch (typeMap[i]) {
						case 'boolean':
							debugSettings[i] = debug.settings[i] == 1;
							break;
					}
				}
				updateSettings({
					debugSettings: debugSettings,
				});

				debug.main.dispose();
				main.main.isVisible = true;
			});

			holder.addControl(debug.main);
		});
	}

	return main.main;
}

function disEn(x: number): string {
	return x == 1 ? 'Enabled' : 'Disabled';
}

function renameControls(id: string): string {
	switch (id) {
		case 'forward':
			return 'Move forward';
		case 'left':
			return 'Move left';
		case 'right':
			return 'Move right';
		case 'backward':
			return 'Move backward';
		case 'fire':
			return 'Break block';
		case 'alt-fire':
			return 'Place block';
		case 'mid-fire':
			return 'Pick block';
		case 'jump':
			return 'Jump';
		case 'inventory':
			return 'Inventory';
		case 'chat':
			return 'Open chat';
		case 'cmd':
			return 'Open chat (with typed /)';
		case 'tab':
			return 'Open player list';
		case 'screenshot':
			return 'Make screenshot';
		case 'hide':
			return 'Hide UI';
		case 'zoom':
			return 'Zoom in';
		default:
			return id;
	}
}
