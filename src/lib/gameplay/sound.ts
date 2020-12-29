import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { getAsset } from '../helpers/assets';

export const sounds = {};

/*
 * Plays sound
 */

export function playSound(sound: string, volume: number, position: number[], noa: any) {
	const id = Object.keys(sounds)[Object.keys(sounds).length - 1] + 1;

	let safeVolume = volume / 10;

	if (0 > volume) safeVolume = 0;
	else if (1 < volume) safeVolume = 0.1;

	console.log('Playing: ' + sound, 'Volume: ' + volume, 'Position: ' + position);

	let url: string = getAsset(sound, 'sound');

	if (position != undefined) {
		sounds[id] = new BABYLON.Sound('Sound', url, noa.rendering.getScene(), play, {
			volume: safeVolume,
			spatialSound: true,
			maxDistance: 100,
		});
		sounds[id].setPosition(new BABYLON.Vector3(position[0], position[1], position[2]));
	} else {
		sounds[id] = new BABYLON.Sound('Sound', url, noa.rendering.getScene(), play, { volume: safeVolume });
	}

	sounds[id].onended = function () {
		delete sounds[id];
	};

	function play() {
		sounds[id].play();
	}
}
