import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { getAsset } from './assets';

export let blocks = {};
export let items = {};
export let blockIDs = {};
export let blockIDmap = {};

export function registerBlocks(noa, blockList) {
	const scene = noa.rendering.getScene();

	blocks = blockList;

	const list = Object.values(blockList);
	list.forEach((x: any) => {
		blockIDs[x.id] = x.rawid;
		blockIDmap[x.rawid] = x.id;
	});

	// Temponary
	noa.registry.registerMaterial('water', [0.5, 0.5, 0.8, 0.7], null, true);
	noa.registry.registerMaterial('barrier', [0.0, 0.0, 0.0, 0.0], null, true);

	console.log('Blocks: ', blockIDs);
	const entries = Object.values(blockList);

	entries.forEach(function (item: any) {
		createBlock(item.rawid, item.id, item.type, item.texture, item.options, item.hardness, item.miningtime, item.tool);
	});

	function createBlock(id, name, type, texture, options, hardness, miningtime, tool) {
		if (type == 0) {
			let mat: any;

			let txtTransparent = options.opaque == false ? true : false;
			let color = options.color != undefined ? Object.values(options.color) : [0, 0, 0];

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
			const mat = noa.rendering.makeStandardMaterial(name);

			let tex: any;

			tex = new BABYLON.Texture(getAsset(texture[0], 'texture'), scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);

			mat.diffuseTexture = tex;
			mat.opacityTexture = mat.diffuseTexture;
			mat.backFaceCulling = true;

			const mesh: any = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, noa.rendering.getScene());
			mesh.material = mat;
			mesh.bakeTransformIntoVertices(BABYLON.Matrix.Scaling(1, 1, 1).setTranslation(new BABYLON.Vector3(0, 0.5, 0)));
			mesh.opaque = false;
			mesh.material.needDepthPrePass = true;

			const finOpts = options;
			finOpts.blockMesh = mesh;
			noa.registry.registerBlock(id, finOpts);
		}
	}
}

export function registerItems(noa, itemList) {
	items = itemList;
	console.log('Items: ', itemList);
}

function makePlantSpriteMesh(noa, scene, url, name) {
	const matname = name || 'sprite-mat';
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

function makeCactusMesh(noa, scene, url, name) {
	const mesh = {};
	const mat = {};
	for (let x = 0; x < 6; x++) {
		let matname = name + '-' + x || 'sprite-mat';
		mesh[x] = BABYLON.Mesh.CreatePlane('sprite-' + matname, 1, scene);
		mat[x] = noa.rendering.makeStandardMaterial(matname + x);
		mat[x].backFaceCulling = false;
		mat[x].diffuseTexture = new BABYLON.Texture(
			getAsset(x < 4 ? url[1] : url[0], 'texture'),
			scene,
			true,
			true,
			BABYLON.Texture.NEAREST_SAMPLINGMODE
		);

		mat[x].diffuseTexture.hasAlpha = true;
		mesh[x].material = mat[x];
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

	const newmesh = BABYLON.Mesh.MergeMeshes(Object.values(mesh), true, true, undefined, false, false);

	return newmesh;
}
