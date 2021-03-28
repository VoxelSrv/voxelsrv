/*
 *
 * Main registry stuff, adds blocks/models to noa engine.
 *
 */

import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import type { Engine } from 'noa-engine';
import { BlockDef } from 'voxelsrv-protocol/js/client';
import { gameSettings } from '../../values';
import { getAsset } from '../helpers/assets';

/*
 * Clean registry copies. Used for lookups
 */

export let blocks = {};
export let items = {};
export let blockIDs = {};
export let blockIDmap = {};

export function registerBlocks(noa: Engine, blockList: BlockDef[]) {
	const scene = noa.rendering.getScene();

	// Saves blocks for later lookups

	if (gameSettings.debugSettings.printRegistryToConsole) {
		console.log('Blocks', blockList);
	}

	// Create lookup tables
	blockList.forEach((x) => {
		blocks[x.id] = x;
		blockIDs[x.id] = x.numId;
		blockIDmap[x.numId] = x.id;
	});

	// Create blocks from registry
	blockList.forEach((block) => {
		try {
			createBlock(block);
		} catch (e) {
			console.error(e, block);
		}
	});

	function createBlock(block: BlockDef) {
		if (block.type == BlockDef.Type.BLOCK) {
			let mat: any;

			let txtTransparent = !block.opaque ?? false;
			let color: number[] = block.color ?? [0, 0, 0];

			if (block.textures.length == 0) {
				noa.registry.registerMaterial(block.id, color, null, false);
				mat = block.id;
			} else if (block.textures.length == 1 && (block.material == undefined || block.material.length == 0)) {
				noa.registry.registerMaterial(block.id, color, block.textures[0] != '' ? getAsset(block.textures[0], 'texture') : null, txtTransparent);
				mat = block.id;
			} else if (block.material == undefined || block.material.length == 0) {
				mat = new Array();
				for (let x = 0; x < block.textures.length; x++) {
					noa.registry.registerMaterial(block.id + x, color, block.textures[x] != '' ? getAsset(block.textures[x], 'texture') : null, txtTransparent);
					mat.push(block.id + x);
				}
			} else {
				mat = block.material.length != 0 ? (block.material.length == 1 ? block.material[0] : block.material) : undefined;
			}

			const finOpts = {
				material: mat,
				opaque: block.opaque ?? true,
				fluid: block.fluid ?? false,
				solid: block.solid ?? true,
				fluidDensity: block.fluidDensity ?? 0,
				viscosity: block.viscosity ?? 0,
			};
			noa.registry.registerBlock(block.numId, finOpts);
		} else if (block.type == BlockDef.Type.CROSS) {
			const mesh = makePlantSpriteMesh(noa, scene, block.textures?.[0] ?? '', block.id);
			const finOpts = {
				material: block.material.length != 0 ? (block.material.length == 1 ? block.material[0] : block.material) : undefined,
				opaque: block.opaque ?? true,
				fluid: block.fluid ?? false,
				solid: block.solid ?? true,
				fluidDensity: block.fluidDensity ?? 0,
				viscosity: block.viscosity ?? 0,
				blockMesh: mesh,
			};
			noa.registry.registerBlock(block.numId, finOpts);
		} else if (block.type == BlockDef.Type.TRANSPARENT) {
			let matl;

			if (block.textures.length == 1 && block.material.length == 0) {
				const mat = noa.rendering.makeStandardMaterial(block.id);

				let tex: any;

				tex = new BABYLON.Texture(getAsset(block.textures[0], 'texture'), scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);

				mat.diffuseTexture = tex;
				mat.opacityTexture = mat.diffuseTexture;
				mat.backFaceCulling = true;
				noa.registry.registerMaterial(block.id, null, null, false, mat);
			} else if (block.material.length == 0) {
				matl = new Array();
				for (let x = 0; x < block.textures.length; x++) {
					const mat = noa.rendering.makeStandardMaterial(block.id);

					let tex: any;

					tex = new BABYLON.Texture(getAsset(block.textures[x], 'texture'), scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);

					mat.diffuseTexture = tex;
					mat.opacityTexture = mat.diffuseTexture;
					mat.backFaceCulling = true;

					noa.registry.registerMaterial(block.id + x, null, null, false, mat);
					mat.push(block.id + x);
				}
			}

			const finOpts = {
				opaque: block.opaque ?? true,
				fluid: block.fluid ?? false,
				solid: block.solid ?? true,
				fluidDensity: block.fluidDensity ?? 0,
				viscosity: block.viscosity ?? 0,
				material: matl,
			};

			//finOpts.blockMesh = mesh;
			noa.registry.registerBlock(block.numId, finOpts);
		}
	}
}

/*
 * Saves for lookup. In future there will be more stuff
 */

export function registerItems(noa, itemList) {
	items = itemList;
	if (gameSettings.debugSettings.printRegistryToConsole) {
		console.log('Items', { ...itemList });
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
