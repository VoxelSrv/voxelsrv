import * as BABYLON from '@babylonjs/core/Legacy/legacy';

import { items, blocks } from '../lib/gameplay/registry';
import { gameSettings } from '../values';
import { getLayer } from './main';

export function setupHand(noa) {
	const scene = getLayer(1);
	const eid = noa.playerEntity;

	const hand = BABYLON.MeshBuilder.CreateBox('hand', { size: 0.08, wrap: true }, scene);

	const handMaterial = new BABYLON.StandardMaterial('hand', scene);
	hand.material = handMaterial;
	hand.rotation.y = -Math.PI / 8;
	hand.position = new BABYLON.Vector3(0.08, -0.08, 0.08);

	const animationBox = new BABYLON.Animation(
		'movement',
		'position.z',
		30,
		BABYLON.Animation.ANIMATIONTYPE_FLOAT,
		BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
	);

	const keys = [];
	keys.push({
		frame: 0,
		value: 0.08,
	});

	keys.push({
		frame: 20,
		value: 0.085,
	});

	keys.push({
		frame: 40,
		value: 0.08,
	});

	keys.push({
		frame: 60,
		value: 0.075,
	});

	keys.push({
		frame: 80,
		value: 0.08,
	});

	animationBox.setKeys(keys);

	hand.animations.push(animationBox);
	scene.beginAnimation(hand, 0, 100, true);

	noa.on('tick', function () {
		//Updates Player's hand
		var inventory = noa.ents.getState(1, 'inventory');
		var inv = inventory.items;
		var sel = inventory.selected;
		var url = new Array(3);
		var preUrl = new Array(3);

		if (items[inv[sel].id].type == 'block') {
			var block = blocks[inv[sel].id];
			var txt = blocks[block].texture;
			preUrl[0] = txt[txt.length - 1];
			preUrl[1] = txt[txt.length - 1];
			preUrl[2] = txt[0];

			for (var x = 0; x < 3; x++) {
				if ((preUrl[x].startsWith('http://') || preUrl[x].startsWith('https://')) && gameSettings.allowcustom == true) url[x] = preUrl[x];
				else url[x] = 'textures/' + preUrl[x] + '.png';
			}
		} else {
		}
		const mat = new BABYLON.Texture(url[1], scene, false, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
		handMaterial.ambientTexture = mat;
	});
}
