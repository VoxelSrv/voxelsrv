import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Mesh } from '@babylonjs/core/Legacy/legacy';
import { gameSettings } from '../../values';
import { getAsset } from './assets';

const models = {};
const templateModels: { [i: string]: BABYLON.Mesh } = {};

let noa: any;

export function defineModelComp(noa2) {
	noa = noa2;

	noa.ents.createComponent({
		name: 'model',
		state: { models: {} },
	});
}

/*
 * Setups and applies model to entity
 */

export async function applyModel(
	eid: number,
	uuid: string,
	model: string,
	texture: string,
	offset: number,
	nametag: boolean,
	name: string,
	hitbox: number[]
) {
	const scene = noa.rendering.getScene();
	if (models[model] == undefined) {
		fetch(getAsset(model, 'model'))
			.then((response) => response.json())
			.then(async (data) => {
				models[model] = data;
				models[model].animations = buildAnimations(data.animations);

				applyModelTo(model, data, texture, name, nametag, eid, uuid, hitbox, scene, offset);
			});
	} else {
		applyModelTo(model, models[model], texture, name, nametag, eid, uuid, hitbox, scene, offset);
	}
}

/*
 * Applies modeel to entity
 */

async function applyModelTo(
	model: string,
	data: object,
	texture: string,
	name: string,
	nametag: boolean,
	eid: number,
	uuid: string,
	hitbox: number[],
	scene: BABYLON.Scene,
	offset: number
) {
	const builded: any = await buildModel(model, data, texture);

	builded.nametag = addNametag(builded.main, name, noa.ents.getPositionData(eid).height, nametag);

	noa.ents.addComponent(eid, 'model', builded);

	const hitboxMesh = BABYLON.MeshBuilder.CreateBox(
		`hitbox-${uuid}`,
		{
			height: hitbox[1],
			width: hitbox[0],
			depth: hitbox[2],
		},
		scene
	);

	hitboxMesh.setParent(builded.main);
	hitboxMesh.setPositionWithLocalVector(new BABYLON.Vector3(0, hitbox[1] / 2, 0));
	hitboxMesh.material = noa.rendering.makeStandardMaterial();
	//hitboxMesh.material.wireframe = true;
	hitboxMesh.isVisible = false;

	noa.rendering.addMeshToScene(hitboxMesh, false);

	noa.entities.addComponent(eid, noa.entities.names.mesh, {
		mesh: builded.main,
		offset: offset,
		animations: models[model].animations,
	});
}

/*
 * Builds model
 */

async function buildModel(name, model, texture) {
	const scene = noa.rendering.getScene();
	const meshlist = { main: null, models: {} };

	if (templateModels[name] == undefined) createTemplateModel(name, model);

	const mesh = templateModels[name].clone(name, null, false, false);
	noa.rendering.addMeshToScene(mesh);

	mesh.getChildMeshes().forEach((cmesh: BABYLON.Mesh) => {
		let partName = cmesh.name.substr(12);
		partName = partName.substr(0, partName.length - 9);

		const mat = noa.rendering.makeStandardMaterial('modelmaterial-' + partName);
		cmesh.material = mat;
		mat.diffuseTexture = new BABYLON.Texture(getAsset(texture, 'texture'), scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
		mat.diffuseTexture.hasAlpha = true;
		noa.rendering.addMeshToScene(cmesh);
		meshlist.models[partName] = cmesh;
	});

	meshlist.main = mesh;

	return meshlist;
}

type AnimationsList = {[index: string]: {
	speed: number;
	parts: {
		[index: string]: string
	}
}}

function buildAnimations(data: AnimationsList) {
	const builded = {}
	return;
}

function createTemplateModel(name, model) {
	const scene = noa.rendering.getScene();
	const scale = 0.06;
	const txtSize = [model.geometry.texturewidth, model.geometry.textureheight];

	const main = new BABYLON.Mesh('main', scene);

	const modeldata = model.geometry.bones;

	for (var x = 0; x < modeldata.length; x++) {
		const mdata = modeldata[x];

		const box = mdata.cubes;
		const part = new Array(box.length);
		const pivot = mdata.pivot;

		for (let y = 0; y < box.length; y++) {
			let add = 0;
			if (box[y].inflate != undefined) add = box[y].inflate;

			const faceUV = new Array(6);

			const size = box[y].size;
			const pos = box[y].origin;
			const off = box[y].uv;

			faceUV[0] = new BABYLON.Vector4(
				(off[0] + size[2]) / txtSize[0],
				(txtSize[1] - size[1] - size[2] - off[1]) / txtSize[1],
				(size[2] + size[0] + off[0]) / txtSize[0],
				(txtSize[1] - size[2] - off[1]) / txtSize[1]
			);
			faceUV[1] = new BABYLON.Vector4(
				(off[0] + size[2] * 2 + size[0]) / txtSize[0],
				(txtSize[1] - size[1] - size[2] - off[1]) / txtSize[1],
				(size[2] * 2 + size[0] * 2 + off[0]) / txtSize[0],
				(txtSize[1] - size[2] - off[1]) / txtSize[1]
			);
			faceUV[2] = new BABYLON.Vector4(
				off[0] / txtSize[0],
				(txtSize[1] - size[1] - size[2] - off[1]) / txtSize[1],
				(off[0] + size[2]) / txtSize[0],
				(txtSize[1] - size[2] - off[1]) / txtSize[1]
			);
			faceUV[3] = new BABYLON.Vector4(
				(off[0] + size[2] + size[0]) / txtSize[0],
				(txtSize[1] - size[1] - size[2] - off[1]) / txtSize[1],
				(size[2] + size[0] * 2 + off[0]) / txtSize[0],
				(txtSize[1] - size[2] - off[1]) / txtSize[1]
			);
			faceUV[4] = new BABYLON.Vector4(
				(size[0] + size[2] + off[0]) / txtSize[0],
				(txtSize[1] - size[2] - off[1]) / txtSize[1],
				(off[0] + size[2]) / txtSize[0],
				(txtSize[1] - off[1]) / txtSize[1]
			);
			faceUV[5] = new BABYLON.Vector4(
				(size[0] * 2 + size[2] + off[0]) / txtSize[0],
				(txtSize[1] - size[2] - off[1]) / txtSize[1],
				(off[0] + size[2] + size[0]) / txtSize[0],
				(txtSize[1] - off[1]) / txtSize[1]
			);

			part[y] = BABYLON.MeshBuilder.CreateBox(
				'part-' + mdata.name + '-' + y,
				{
					height: (size[1] + add) * scale,
					width: (size[0] + add) * scale,
					depth: (size[2] + add) * scale,
					faceUV: faceUV,
					wrap: true,
				},
				scene
			);

			part[y].position = new BABYLON.Vector3(
				-(pos[0] + (size[0] - add / 2) / 2) * scale,
				(pos[1] + (size[1] - add / 2) / 2) * scale,
				(pos[2] + (size[2] - add / 2) / 2) * scale
			);

			var mat = noa.rendering.makeStandardMaterial('modelmaterial-' + mdata.name + '-' + y);
			part[y].material = mat;

			part[y].opaque = false;
		}
		const mesh = BABYLON.Mesh.MergeMeshes(part, true, true, undefined, true, true);
		mesh.setParent(main);
		mesh.setPivotMatrix(BABYLON.Matrix.Translation(-pivot[0] * scale, -pivot[1] * scale, -pivot[2] * scale));
	}

	templateModels[name] = main;

	return main;
}

export function addNametag(mainMesh: Mesh, name: string, height: number, visible: boolean) {
	console.log(mainMesh, name, height, visible)
	const scene = noa.rendering.getScene();

	const font_size = 96;
	const font = 'bold ' + font_size + "px 'lato'";

	//Set height for plane
	const planeHeight = 0.3;

	//Set height for dynamic texture
	const DTHeight = 1.5 * font_size; //or set as wished

	//Calcultae ratio
	const ratio = planeHeight / DTHeight;

	//Use a temporay dynamic texture to calculate the length of the text on the dynamic texture canvas
	const temp = new BABYLON.DynamicTexture('DynamicTexture', 64, scene, false);
	const tmpctx = temp.getContext();
	tmpctx.font = font;
	const DTWidth = tmpctx.measureText(name).width + 8;

	//Calculate width the plane has to be
	const planeWidth = DTWidth * ratio;

	//Create dynamic texture and write the text
	const dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', { width: DTWidth, height: DTHeight }, scene, false);
	const mat = noa.rendering.makeStandardMaterial('nametag');
	mat.diffuseTexture = dynamicTexture;
	mat.emissiveTexture = mat.diffuseTexture;
	mat.diffuseTexture.hasAlpha = true;
	mat.opacityTexture = mat.diffuseTexture;
	dynamicTexture.drawText(name, null, null, font, '#eeeeee', '#00000066', true);

	//Create plane and set dynamic texture as material
	const plane = BABYLON.MeshBuilder.CreatePlane('plane', { width: planeWidth, height: planeHeight }, scene);
	plane.material = mat;


	// @ts-ignore
	plane.opaque = false;
	plane.rotation.x = 0;
	plane.rotation.y = 0;

	plane.isVisible = visible;

	plane.setParent(mainMesh);
	plane.setPositionWithLocalVector(new BABYLON.Vector3(0, height + 0.2, 0));
	noa.rendering.addMeshToScene(plane);

	return plane;
}
