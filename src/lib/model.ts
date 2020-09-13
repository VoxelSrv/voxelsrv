import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { gameSettings } from '../values';

const models = {};

let noa: any;

export function defineModelComp(noa2) {
	noa = noa2;

	noa.ents.createComponent({
		name: 'model',
		state: { models: {} },
	});
}

export function applyModel(eid: number, uuid: string, model: string, texture: string, offset: number[], nametag: boolean, name: string, hitbox: number[]) {
	const scene = noa.rendering.getScene();
	if (models[model] == undefined) {
		fetch('./models/' + model + '.json')
			.then((response) => response.json())
			.then(function (data) {
				const builded: any = buildModel(data, texture);
				models[model] = data;

				if (nametag) builded.nametag = addNametag(builded.main, name, noa.ents.getPositionData(eid).height);

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
				hitboxMesh.material.wireframe = true;

				noa.rendering.addMeshToScene(hitboxMesh, false);

				noa.entities.addComponent(eid, noa.entities.names.mesh, {
					mesh: builded.main,
					offset: offset,
				});
			});
	} else {
		const builded: any = buildModel(models[model], texture);
		if (nametag) builded.nametag = addNametag(builded.main, name, noa.ents.getPositionData(eid).height);

		noa.ents.addComponent(eid, 'model', builded);

		noa.entities.addComponent(eid, noa.entities.names.mesh, {
			mesh: builded.main,
			offset: offset,
		});
	}
}

function buildModel(model, texture) {
	console.log('Building model...');

	const scene = noa.rendering.getScene();
	const scale = 0.06
	const txtSize = [model.geometry.texturewidth, model.geometry.textureheight];

	const main = new BABYLON.Mesh('main', scene);

	const modeldata = model.geometry.bones;

	const meshlist = {};

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

			part[y].position = new BABYLON.Vector3(-(pos[0] + (size[0] - add/2) / 2) * scale, (pos[1] + (size[1] - add/2) / 2) * scale, (pos[2] + (size[2] - add/2) / 2) * scale);

			var mat = noa.rendering.makeStandardMaterial('modelmaterial-' + mdata.name + '-' + y);
			part[y].material = mat;
			if ((texture.startsWith('http://') || texture.startsWith('https://')) && gameSettings.allowcustom == true)
				mat.diffuseTexture = new BABYLON.Texture(texture, scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
			else mat.diffuseTexture = new BABYLON.Texture('textures/' + texture + '.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);

			part[y].opaque = false;
			mat.diffuseTexture.hasAlpha = true;
		}		
		const mesh = BABYLON.Mesh.MergeMeshes(part, true, true, undefined, true, true);
		mesh.setParent(main);
		mesh.setPivotMatrix(BABYLON.Matrix.Translation(-pivot[0] * scale, -pivot[1] * scale, -pivot[2] * scale));

		console.log(mdata.name, mesh)
		meshlist[mdata.name] = mesh;

		noa.rendering.addMeshToScene(mesh);
	}

	console.log(meshlist);

	return { main: main, models: meshlist };
}

function addNametag(mainMesh, name, height) {
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

	plane.setPositionWithLocalVector(new BABYLON.Vector3(0, height + 0.2, 0));

	// @ts-ignore
	plane.opaque = false;

	plane.setParent(mainMesh);
	noa.rendering.addMeshToScene(plane);

	return plane;
}
