/*
 *
 * Main registry stuff, adds blocks/models to noa engine.
 *
 */

import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import * as MATERIALS from '@babylonjs/materials';
import type { Engine } from 'noa-engine';
import { gameSettings } from '../../values';
import { getAsset } from '../helpers/assets';

/*
 * Clean registry copies. Used for lookups
 */

export let blocks = {};
export let items = {};
export let blockIDs = {};
export let blockIDmap = {};

export function registerBlocks(noa: Engine, blockList) {
	const scene = noa.rendering.getScene();

	// Saves blocks for later lookups

	if (gameSettings.debugSettings.printRegistryToConsole) {
		console.log('Blocks', blockList);
	}

	blocks = blockList;

	// Create lookup tables
	const list = Object.values(blockList);
	list.forEach((x: any) => {
		blockIDs[x.id] = x.rawid;
		blockIDmap[x.rawid] = x.id;
	});

	// Temponary
	noa.registry.registerMaterial('water', [0.5, 0.5, 0.8, 0.7], null, true);
	noa.registry.registerMaterial('barrier', [0.0, 0.0, 0.0, 0.0], null, true);

	const entries = Object.values(blockList);

	// Create blocks from registry
	entries.forEach(function (item: any) {
		try {
			createBlock(item.rawid, item.id, item.type, item.texture, item.options, item.hardness, item.miningtime, item.tool);
		} catch (e) {
			console.log(e);
		}
	});

	function createBlock(id, name, type, texture, options, hardness, miningtime, tool) {
		if (type == 0) {
			let mat: any;

			let txtTransparent = options.opaque == false ? true : false;
			let color: number[] = options.color != undefined ? Object.values(options.color) : [0, 0, 0];

			if (texture == undefined) texture = [''];

			if (texture.length == 1 && options.material == undefined) {
				noa.registry.registerMaterial(name, color, texture[0] != '' ? getAsset(texture[0], 'texture') : null, txtTransparent);
				mat = name;
			} else if (options.material == undefined) {
				mat = new Array();
				for (let x = 0; x < texture.length; x++) {
					noa.registry.registerMaterial(name + x, color, texture[x] != '' ? getAsset(texture[x], 'texture') : null, txtTransparent);
					mat.push(name + x);
				}
			} else {
				mat = options.material;
			}
			const finOpts = options;
			finOpts.material = mat;
			noa.registry.registerBlock(id, finOpts);
		} else if (type == 1) {
			const mesh = makePlantSpriteMesh(noa, scene, texture[0], name);
			const finOpts = options;
			finOpts.blockMesh = mesh;
			noa.registry.registerBlock(id, finOpts);
		} else if (type == 2) {
			const mesh = makeCactusMesh(noa, scene, [texture[0], texture[1]], name);
			const finOpts = options;
			finOpts.blockMesh = mesh;
			noa.registry.registerBlock(id, finOpts);
		} else if (type == 4) {
			let matl;

			if (texture.length == 1 && options.material == undefined) {
				const mat = noa.rendering.makeStandardMaterial(name);

				let tex: any;

				tex = new BABYLON.Texture(getAsset(texture[0], 'texture'), scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);

				mat.diffuseTexture = tex;
				mat.opacityTexture = mat.diffuseTexture;
				mat.backFaceCulling = true;
				noa.registry.registerMaterial(name, null, null, false, mat);
				matl = name;
			} else if (options.material == undefined) {
				matl = new Array();
				for (let x = 0; x < texture.length; x++) {
					const mat = noa.rendering.makeStandardMaterial(name);

					let tex: any;

					tex = new BABYLON.Texture(getAsset(texture[0], 'texture'), scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);

					mat.diffuseTexture = tex;
					mat.opacityTexture = mat.diffuseTexture;
					mat.backFaceCulling = true;

					noa.registry.registerMaterial(name + x, null, null, false, mat);
					mat.push(name + x);
				}
			}

			const finOpts = options;
			finOpts.material = matl;

			//finOpts.blockMesh = mesh;
			noa.registry.registerBlock(id, finOpts);
		}
	}
}

/*
 * Saves for lookup. In future there will be more stuff
 */

export function registerItems(noa, itemList) {
	items = itemList;
	if (gameSettings.debugSettings.printRegistryToConsole) {
		console.log('Items', {...itemList});
	}
}

/*
 * Creates X shaped mesh
 */

function makePlantSpriteMesh(noa, scene, url, name) {
	const matname = name || 'mat';
	let tex = new BABYLON.Texture(getAsset(url, 'texture'), scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	tex.hasAlpha = true;
	const mesh = BABYLON.Mesh.CreatePlane('sprite-' + matname, 1, scene);
	const mat = noa.rendering.makeStandardMaterial(matname);
	mat.backFaceCulling = false;
	mat.diffuseTexture = tex;
	mat.diffuseTexture.vOffset = 0.99;
	mesh.material = mat;
	mesh.rotation.y += 0.81;

	const offset = BABYLON.Matrix.Translation(0, 0.5, 0);
	mesh.bakeTransformIntoVertices(offset);
	const clone = mesh.clone();
	clone.rotation.y += 1.62;

	return BABYLON.Mesh.MergeMeshes([mesh, clone], true);
}

/*
 * Creates cactus mesh. It's little broken rn. Todo: replace it with custom model support
 */

function makeCactusMesh(noa, scene: BABYLON.Scene, url: string[], name: string) {
	const mesh = {};

	let matname = name || 'mat';

	const mat: BABYLON.StandardMaterial = noa.rendering.makeStandardMaterial(matname);
	const mat2: BABYLON.StandardMaterial = noa.rendering.makeStandardMaterial(matname);

	mat.backFaceCulling = false;
	mat2.backFaceCulling = false;

	const top = getAsset(url[0], 'texture');
	const side = getAsset(url[1], 'texture');

	mat.diffuseTexture = new BABYLON.Texture(side, scene, true, true, BABYLON.Texture.NEAREST_LINEAR); //new BABYLON.CubeTexture(side, scene, [], false, [side, top, side, side, top, side]);
	mat.diffuseTexture.hasAlpha = true;

	mat2.diffuseTexture = new BABYLON.Texture(top, scene, true, true, BABYLON.Texture.NEAREST_LINEAR); //new BABYLON.CubeTexture(side, scene, [], false, [side, top, side, side, top, side]);
	mat2.diffuseTexture.hasAlpha = true;

	for (let x = 0; x < 6; x++) {
		mesh[x] = BABYLON.Mesh.CreatePlane('sprite-' + matname, 1, scene);
		mesh[x].material = mat;
		let offset: any;
		switch (x) {
			case 0:
				offset = BABYLON.Matrix.Translation(0, 0.5, 0.435);
				mesh[x].rotation.y = 1.57;
				break;
			case 1:
				offset = BABYLON.Matrix.Translation(0, 0.5, -0.435);
				mesh[x].rotation.y = 1.57;
				break;
			case 2:
				offset = BABYLON.Matrix.Translation(0, 0.5, 0.435);
				break;
			case 3:
				offset = BABYLON.Matrix.Translation(0, 0.5, -0.435);
				break;
			case 4:
				offset = BABYLON.Matrix.Translation(0, 0, -1);
				mesh[x].rotation.x = 1.57;
				break;
			case 5:
				offset = BABYLON.Matrix.Translation(0, 0, 0);
				mesh[x].rotation.x = 1.57;
				break;
		}

		mesh[x].bakeTransformIntoVertices(offset);
	}

	const newmesh = BABYLON.Mesh.MergeMeshes(Object.values(mesh), true, true, undefined, true, false);

	for (let x = 0; x < 6; x++) {
		switch (x) {
			case 0:
				newmesh.subMeshes[x].materialIndex = 1;
				break;
			case 1:
				newmesh.subMeshes[x].materialIndex = 1;
				break;
			case 2:
				newmesh.subMeshes[x].materialIndex = 0;
				break;
			case 3:
				newmesh.subMeshes[x].materialIndex = 0;
				break;
			case 4:
				newmesh.subMeshes[x].materialIndex = 0;
				break;
			case 5:
				newmesh.subMeshes[x].materialIndex = 0;
				break;
		}
	}

	return newmesh;
}
