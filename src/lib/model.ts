import * as BABYLON from 'babylonjs';
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

export function applyModel(eid: number, model: string, texture: string, offset: number[], nametag: boolean, name: string, hitbox: number[]) {
	const scene = noa.rendering.getScene();
	if (models[model] == undefined) {
		fetch('./models/' + model + '.jem')
			.then((response) => response.json())
			.then(function (data) {
				const builded: any = buildModel(data, texture);
				models[model] = data;

				if (nametag) builded.nametag = addNametag(builded.main, name, noa.ents.getPositionData(eid).height);

				noa.ents.addComponent(eid, 'model', builded);

				const hitboxMesh = BABYLON.MeshBuilder.CreateBox(
					'hitbox',
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
		var builded: any = buildModel(models[model], texture);
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

	var scale = 1;

	var scene = noa.rendering.getScene();
	var txtSize = model.textureSize;

	var main = new BABYLON.Mesh('main', scene);

	var modeldata = model.models;

	var meshlist = {};

	for (var x = 0; x < modeldata.length; x++) {
		var mdata = modeldata[x];
		var pivot = mdata.translate;

		//bone.setPositionWithLocalVector(new BABYLON.Vector3(mdata.translate[0]/scale, mdata.translate[1]/scale, mdata.translate[2]/scale));
		var box = mdata.boxes;
		var part = new Array(box.length);

		for (var y = 0; y < box.length; y++) {
			var add = 0;
			if (box[y].sizeAdd != undefined) add = box[y].sizeAdd;

			var faceUV = new Array(6);

			var cords = box[y].coordinates;
			var off = box[y].textureOffset;

			faceUV[0] = new BABYLON.Vector4(
				(off[0] + cords[5]) / txtSize[0],
				(txtSize[1] - cords[4] - cords[5] - off[1]) / txtSize[1],
				(cords[3] + cords[5] + off[0]) / txtSize[0],
				(txtSize[1] - cords[5] - off[1]) / txtSize[1]
			);
			faceUV[1] = new BABYLON.Vector4(
				(off[0] + cords[5] * 2 + cords[3]) / txtSize[0],
				(txtSize[1] - cords[4] - cords[5] - off[1]) / txtSize[1],
				(cords[5] * 2 + cords[3] * 2 + off[0]) / txtSize[0],
				(txtSize[1] - cords[5] - off[1]) / txtSize[1]
			);
			faceUV[2] = new BABYLON.Vector4(
				off[0] / txtSize[0],
				(txtSize[1] - cords[4] - cords[5] - off[1]) / txtSize[1],
				(off[0] + cords[5]) / txtSize[0],
				(txtSize[1] - cords[5] - off[1]) / txtSize[1]
			);
			faceUV[3] = new BABYLON.Vector4(
				(off[0] + cords[5] + cords[3]) / txtSize[0],
				(txtSize[1] - cords[4] - cords[5] - off[1]) / txtSize[1],
				(cords[5] + cords[3] * 2 + off[0]) / txtSize[0],
				(txtSize[1] - cords[5] - off[1]) / txtSize[1]
			);
			faceUV[4] = new BABYLON.Vector4(
				(cords[3] + cords[5] + off[0]) / txtSize[0],
				(txtSize[1] - cords[5] - off[1]) / txtSize[1],
				(off[0] + cords[5]) / txtSize[0],
				(txtSize[1] - off[1]) / txtSize[1]
			);
			faceUV[5] = new BABYLON.Vector4(
				(cords[3] * 2 + cords[5] + off[0]) / txtSize[0],
				(txtSize[1] - cords[5] - off[1]) / txtSize[1],
				(off[0] + cords[5] + cords[3]) / txtSize[0],
				(txtSize[1] - off[1]) / txtSize[1]
			);

			part[y] = BABYLON.MeshBuilder.CreateBox(
				'part-' + mdata.id + '-' + y,
				{
					height: (cords[4] + add * 2) / scale,
					width: (cords[3] + add * 2) / scale,
					depth: (cords[5] + add * 2) / scale,
					faceUV: faceUV,
					// @ts-ignore
					wrap: true,
				},
				scene
			);

			part[y].setPivotMatrix(BABYLON.Matrix.Translation(pivot[0], pivot[1], pivot[2]));

			//part.locallyTranslate(new BABYLON.Vector3((cords[0] + add/2)/scale, (cords[1] + add/2)/scale, (cords[2] + add/2)/scale));
			part[y].setPositionWithLocalVector(
				new BABYLON.Vector3(
					(cords[0] + cords[3] / 2 + add / 2) / scale,
					(cords[1] + cords[4] / 2 + add / 2) / scale,
					(cords[2] + cords[5] / 2 + add / 2) / scale
				)
			);

			var mat = noa.rendering.makeStandardMaterial('modelmaterial-' + mdata.id + '-' + y);
			part[y].material = mat;
			if ((texture.startsWith('http://') || texture.startsWith('https://')) && gameSettings.allowcustom == true)
				mat.diffuseTexture = new BABYLON.Texture(texture, scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
			else mat.diffuseTexture = new BABYLON.Texture('textures/' + texture + '.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);

			part[y].opaque = false;
			mat.diffuseTexture.hasAlpha = true;
		}

		var mesh = BABYLON.Mesh.MergeMeshes(part, true, true, undefined, true, true);

		mesh.setParent(main);

		mesh.scaling = new BABYLON.Vector3(0.06, 0.06, 0.06);

		meshlist[mdata.id] = mesh;

		noa.rendering.addMeshToScene(mesh);
	}

	return { main: main, models: meshlist };
}

function addNametag(mainMesh, name, height) {
	var scene = noa.rendering.getScene();

	var font_size = 96;
	var font = 'bold ' + font_size + "px 'lato'";

	//Set height for plane
	var planeHeight = 0.3;

	//Set height for dynamic texture
	var DTHeight = 1.5 * font_size; //or set as wished

	//Calcultae ratio
	var ratio = planeHeight / DTHeight;

	//Use a temporay dynamic texture to calculate the length of the text on the dynamic texture canvas
	var temp = new BABYLON.DynamicTexture('DynamicTexture', 64, scene, false);
	var tmpctx = temp.getContext();
	tmpctx.font = font;
	var DTWidth = tmpctx.measureText(name).width + 8;

	//Calculate width the plane has to be
	var planeWidth = DTWidth * ratio;

	//Create dynamic texture and write the text
	var dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', { width: DTWidth, height: DTHeight }, scene, false);
	var mat = noa.rendering.makeStandardMaterial('nametag');
	mat.diffuseTexture = dynamicTexture;
	mat.emissiveTexture = mat.diffuseTexture;
	mat.diffuseTexture.hasAlpha = true;
	mat.opacityTexture = mat.diffuseTexture;
	dynamicTexture.drawText(name, null, null, font, '#eeeeee', '#00000066', true);

	//Create plane and set dynamic texture as material
	var plane = BABYLON.MeshBuilder.CreatePlane('plane', { width: planeWidth, height: planeHeight }, scene);
	plane.material = mat;

	plane.setPositionWithLocalVector(new BABYLON.Vector3(0, height + 0.2, 0));

	// @ts-ignore
	plane.opaque = false;

	plane.setParent(mainMesh);
	noa.rendering.addMeshToScene(plane);

	return plane;
}
