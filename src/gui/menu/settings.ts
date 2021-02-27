import { defaultSettings, defaultValues, gameSettings, serverSettings, updateSettings } from '../../values';
import { isSingleplayer, socketSend } from '../../lib/gameplay/connect';
import { BackHandler, SettingsGUI } from '../parts/settingsHelper';
import * as GUI from '@babylonjs/gui/';
import { rebindControls } from '../../lib/player/controls';
import { re } from 'mathjs';
import { isMobile } from 'mobile-device-detect';

export default function buildSettings(noa, openMenu, holder: GUI.Rectangle) {
	const backHander: BackHandler = (id: string, settings: any) => {
		updateSettings({
			nickname: settings.nickname,
			scale: settings.scale,
			viewDistance: settings.viewDistance,
			fov: settings.fov,
			debugInfo: settings.debugInfo == 1,
			showFPS: settings.showFPS == 1
		});

		noa.world.chunkAddDistance = settings.viewDistance;
		noa.world.chunkRemoveDistance = settings.viewDistance + 0.5;

		if (isSingleplayer()) {
			socketSend('SingleplayerViewDistance', { value: settings.viewDistance });
		}

		if (serverSettings.ingame) {
			noa.rendering.getScene().cameras[0].fov = (settings.fov * Math.PI) / 180;
		}

		openMenu('main');
	};

	const main = new SettingsGUI('main', [{ text: 'Settings' }], backHander);
	main.createInput('nickname', 'Nickname', gameSettings.nickname, `Write your nickname`, 'Enter your nickname');
	main.createSlider('scale', (v) => `GUI scale: ${v}`, gameSettings.scale, 2, 5, 1);
	main.createSlider('fov', (v) => `FOV: ${v}`, gameSettings.fov, 20, 120, 1);
	main.createSlider('viewDistance', (v) => `View Distance: ${v}`, gameSettings.viewDistance, 2, 16, 1);
	main.createSelectable('showFPS', (v) => `FPS Counter: ${disEn(v)}`, gameSettings.showFPS ? 1 : 0, [false, true]);
	main.createSelectable('debugInfo', (v) => `Debug information: ${disEn(v)}`, gameSettings.debugInfo ? 1 : 0, [false, true]);

	const controlsButton = main.createItem('controls', 'Controls...');

	controlsButton.item.onPointerClickObservable.add(() => {
		main.main.isVisible = false;

		const controlsBack = (id, settings) => {
			const controls = { ...gameSettings.controls };

			for (const i in settings) {
				if (i.startsWith('key-')) {
					controls[i.substring(4)] = settings[i];
				}
			}

			updateSettings({
				mouse: settings.mouse,
				gamepad: settings.gamepad == 1,
				controls: controls,
			});

			rebindControls(noa, controls);

			noa.camera.sensitivityX = settings.mouse;
			noa.camera.sensitivityY = settings.mouse;

			main.main.isVisible = true;
		};

		const controls = new SettingsGUI('main', [{ text: 'Controls...' }], controlsBack);
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
	});

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
