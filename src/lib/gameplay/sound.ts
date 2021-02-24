import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Engine } from 'noa-engine';
import { getAsset } from '../helpers/assets';

export const sounds: { [i: string]: BABYLON.Sound } = {};
export const soundMesh: { [i: string]: BABYLON.Mesh } = {};

/*
 * Plays sound
 */

export function playSound(sound: string, volume: number, position: number[], noa: Engine) {
	const id = Object.keys(sounds)[Object.keys(sounds).length - 1] + 1;

	let safeVolume = volume / 10;

	if (0 > volume) safeVolume = 0;
	else if (1 < volume) safeVolume = 0.1;

	console.log('Playing: ' + sound, 'Volume: ' + volume, 'Position: ' + position);

	let url: string = getAsset(sound, 'sound');
	const scene = noa.rendering.getScene();

	sounds[id] = new BABYLON.Sound('Sound', url, scene, () => sounds[id].play(), { volume: safeVolume });


	if (position != undefined && position.length == 3) {
		sounds[id] = new BABYLON.Sound('Sound', url, scene, () => sounds[id].play(), {
			volume: safeVolume,
		});

		soundMesh[id] = new BABYLON.Mesh('', scene);
		noa.rendering.addMeshToScene(soundMesh[id], true, position);
		sounds[id].attachToMesh(soundMesh[id]);
	}

	sounds[id].onended = function () {
		soundMesh[id].dispose();
		delete soundMesh[id];
		sounds[id].dispose();
		delete sounds[id];
	};
}
