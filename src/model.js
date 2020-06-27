import { normalizeReference } from "markdown-it/lib/common/utils"

var models = {}

var noa

export function defineModelComp(noa2) {
	noa = noa2

	noa.ents.createComponent({
		name: 'model',
		state: {models:{}}
	})
}

export function applyModel(eid, model, texture, offset) {
	if (models[model] == undefined) {
		fetch('./models/' + model + '.jem').then(response => response.json()).then(function(data) {
			var builded = buildModel(data, texture)
			noa.ents.addComponent(eid, 'model', builded)

			noa.entities.addComponent(eid, noa.entities.names.mesh, {
				mesh: builded.main,
				offset: offset
			})
		})
	} else {
		var builded = buildModel(models[model], texture)
		noa.ents.addComponent(eid, 'model', builded)

		noa.entities.addComponent(eid, noa.entities.names.mesh, {
			mesh: builded.main,
			offset: offset
		})
	}



	/*var mesh = BABYLON.MeshBuilder.CreateBox("player", {height: 1.85, width: 0.5, depth: 0.5}, scene)

	noa.entities.addComponent(eid, noa.entities.names.mesh, {
		mesh: mesh,
		offset: [0, 0.9, 0]
	})*/
}



function buildModel(model, texture) {
	console.log('Building model...')

	var scale = 12

	var scene = noa.rendering.getScene()
	var txtSize = model.textureSize

	var main = new BABYLON.Mesh('main', scene)

	var modeldata = model.models

	var meshlist = {}

	for(var x = 0; x < modeldata.length; x++  ) {
		var mdata = modeldata[x]
		var bone = new BABYLON.Mesh(mdata.id, scene)
		bone.parent = main

		noa.rendering.addMeshToScene(bone, false)

		//bone.setPositionWithLocalVector(new BABYLON.Vector3(mdata.translate[0]/scale, mdata.translate[1]/scale, mdata.translate[2]/scale));


		meshlist[mdata.id] = {bone: bone}

		var box = mdata.boxes

		for(var y = 0; y < box.length; y++  ) {
			var add = 0
			if (box[y].sizeAdd != undefined) add = box[y].sizeAdd

			var faceUV = new Array(6)

			var cords = box[y].coordinates
			var off = box[y].textureOffset

			console.log(cords)
			faceUV[0] = new BABYLON.Vector4( ( off[0] + cords[5] ) / txtSize[0], (txtSize[1] - cords[4] - cords[5] - off[1]) / txtSize[1], ( cords[3] + cords[5] + off[0] ) / txtSize[0], ( txtSize[1] - cords[5] - off[1] )/ txtSize[1])
			faceUV[1] = new BABYLON.Vector4( ( off[0] + cords[5]*2 + cords[3] ) / txtSize[0], (txtSize[1] - cords[4] - cords[5] - off[1]) / txtSize[1], ( cords[5]*2 + cords[3]*2 + off[0] ) / txtSize[0], ( txtSize[1] - cords[5] - off[1] )/ txtSize[1])
			faceUV[2] = new BABYLON.Vector4( ( off[0] ) / txtSize[0], (txtSize[1] - cords[4] - cords[5] - off[1]) / txtSize[1], (off[0] + cords[5] ) / txtSize[0], ( txtSize[1] - cords[5] - off[1] )/ txtSize[1])
			faceUV[3] = new BABYLON.Vector4( ( off[0] + cords[5] + cords[3] ) / txtSize[0], (txtSize[1] - cords[4] - cords[5] - off[1]) / txtSize[1], ( cords[5] + cords[3]*2 + off[0] ) / txtSize[0], ( txtSize[1] - cords[5] - off[1] )/ txtSize[1])
			faceUV[4] = new BABYLON.Vector4( ( cords[3] + cords[5] + off[0] ) / txtSize[0], (txtSize[1] - cords[5] - off[1]) / txtSize[1], ( off[0] + cords[5] ) / txtSize[0], ( txtSize[1] - off[1] )/ txtSize[1])
			faceUV[5] = new BABYLON.Vector4( ( cords[3]*2 + cords[5] + off[0] ) / txtSize[0], (txtSize[1] - cords[5] - off[1]) / txtSize[1], ( off[0] + cords[5] + cords[3] ) / txtSize[0], ( txtSize[1] - off[1] )/ txtSize[1])

			console.log(mdata.id, faceUV)

			var part = new BABYLON.MeshBuilder.CreateBox('part-' + mdata.id + '-' + y, {
				height: (box[y].coordinates[4] + add)/scale,
				width: (box[y].coordinates[3] + add)/scale,
				depth: (box[y].coordinates[5] + add)/scale,
				faceUV: faceUV,
				wrap: true
			}, scene)

			part.setPositionWithLocalVector(new BABYLON.Vector3((box[y].coordinates[0] + add/2)/scale, (box[y].coordinates[1] + add/2)/scale, (box[y].coordinates[2] + add/2)/scale));

			var mat = noa.rendering.makeStandardMaterial('modelmaterial-' + mdata.id + '-' + y)
			part.material = mat
			mat.diffuseTexture = new BABYLON.Texture('textures/' + texture + '.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)



			part.opaque = false
			mat.opacityTexture = mat.diffuseTexture
			//mat.needDepthPrePass = true


			part.parent = bone
			meshlist[mdata.id][y] = part

			noa.rendering.addMeshToScene(part, false)

		}
	}


	return {main: main, models: meshlist}
}