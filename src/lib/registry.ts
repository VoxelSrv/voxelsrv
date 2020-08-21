import { gameSettings } from '../values';
import * as BABYLON from 'babylonjs';

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

			let txtTransparent = false;
			if (options.opaque == false) txtTransparent = true;

			if (texture.length == 1 && options.material == undefined) {
				if ((texture[0].startsWith('http://') || texture[0].startsWith('https://')) && gameSettings.allowcustom == true)
					noa.registry.registerMaterial(name, [0, 0, 0], texture[0], txtTransparent);
				else noa.registry.registerMaterial(name, [0, 0, 0], 'textures/' + texture[0] + '.png', txtTransparent);
				mat = name;
			} else if (options.material == undefined) {
				mat = new Array();
				for (let x = 0; x < texture.length; x++) {
					if ((texture[x].startsWith('http://') || texture[x].startsWith('https://')) && gameSettings.allowcustom == true)
						noa.registry.registerMaterial(name + x, [0, 0, 0], texture[x], txtTransparent);
					else noa.registry.registerMaterial(name + x, [0, 0, 0], 'textures/' + texture[x] + '.png', txtTransparent);
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

			if ((texture[0].startsWith('http://') || texture[0].startsWith('https://')) && gameSettings.allowcustom == true)
				tex = new BABYLON.Texture(texture[0], scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
			else tex = new BABYLON.Texture('textures/' + texture[0] + '.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);

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
	// buildBlockModels(itemList); Don't

	items = itemList;
	console.log('Items: ', itemList);
}

async function buildBlockModels(items) {
	const canv = document.createElement('canvas');
	canv.height = 256;
	canv.width = 256;
	canv.style.zIndex = '99999';
	canv.style.position = 'fixed';
	document.body.appendChild(canv);

	const engine = new BABYLON.Engine(canv);
	const scene = new BABYLON.Scene(engine, { virtual: false });

	scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
	const camera = new BABYLON.ArcRotateCamera('Camera', -Math.PI / 2, Math.PI / 3.5, 2.4, new BABYLON.Vector3(0, 0.15, 0), scene);

	var light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(-0.5, 0.8, 0.2), scene);
	light.intensity = 1;

	const mesh = {};
	const mat = {};
	for (let x = 0; x < 3; x++) {
		mesh[x] = BABYLON.Mesh.CreatePlane('sprite', 1, scene);
		mesh[x].opaque = false;

		mat[x] = new BABYLON.StandardMaterial('', scene);
		mat[x].backFaceCulling = false;
		mat[x].opacityTexture = mat[x].diffuseTexture;
		mesh[x].material = mat[x];

		let offset = BABYLON.Matrix.Translation(0, 0.0, 0.5);
		switch (x) {
			case 0:
				offset = BABYLON.Matrix.Translation(0, 0.25, -0.5);
				mesh[x].rotation.y = 1.57 - Math.PI / 4;
				break;
			case 1:
				offset = BABYLON.Matrix.Translation(0, 0.25, -0.5);
				mesh[x].rotation.y = -Math.PI / 4;
				break;
			case 2:
				offset = BABYLON.Matrix.Translation(0, 0, -0.75);
				mesh[x].rotation.x = 1.57;
				mesh[x].rotation.y = -Math.PI / 4;
				break;
		}

		mesh[x].bakeTransformIntoVertices(offset);
	}

	const array = Object.keys(items);
	let x = 0;

	const y = setInterval(() => {
		x++;
		if (x >= array.length) return;
		const item = items[array[x]];
		console.log(item);

		if (item.type != 'ItemBlock') return;

		const tex0 = new BABYLON.Texture('https://i.imgur.com/mvpsEa1.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
		const tex1 = new BABYLON.Texture('https://i.imgur.com/NgjpmS8.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
		const tex2 = new BABYLON.Texture('https://i.imgur.com/mvpsEa1.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);

		mesh[0].material.diffuseTexture = tex0;
		mesh[1].material.diffuseTexture = tex1;
		mesh[2].material.diffuseTexture = tex2;

		mesh[0].material.opacityTexture = tex0;
		mesh[1].material.opacityTexture = tex1;
		mesh[2].material.opacityTexture = tex2;

		scene.render(true);

		BABYLON.Tools.CreateScreenshot(engine, camera, 128, function (data) {
			item.blockTexture = data;
			console.log(data);
		});
	}, 100);
}

function makePlantSpriteMesh(noa, scene, url, name) {
	const matname = name || 'sprite-mat';
	let tex: any;
	if ((url.startsWith('http://') || url.startsWith('https://')) && gameSettings.allowcustom == true)
		tex = new BABYLON.Texture(url, scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	else tex = new BABYLON.Texture('textures/' + url + '.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
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
		if (((x < 4 ? url[1] : url[0]).startsWith('http://') || (x < 4 ? url[1] : url[0]).startsWith('https://')) && gameSettings.allowcustom == true)
			mat[x].diffuseTexture = new BABYLON.Texture(x < 4 ? url[1] : url[0], scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
		else
			mat[x].diffuseTexture = new BABYLON.Texture(
				'textures/' + (x < 4 ? url[1] : url[0]) + '.png',
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
