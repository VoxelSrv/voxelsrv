import { MaxBlock } from "babylonjs"

global.blockIDs = {}
global.blocks = {}
global.items = {}

export function getBlocks() { return blocks}
export function getItems() { return items}
export function getBlockIDs() { return blockIDs}



export function registerBlocks(noa, blockList, idList) {
	var scene = noa.rendering.getScene()

	blockIDs = idList
	blocks = blockList

	// Temponary
	noa.registry.registerMaterial('water', [0.5, 0.5, 0.8, 0.7], null, true)
	noa.registry.registerMaterial('barrier', [0.0, 0.0, 0.0, 0.0], null, true)

	console.log('Blocks: ', blockIDs)
	var entries = Object.entries(blockList)

	entries.forEach(function(item) {
		createBlock(item[0], item[1].name, item[1].type, item[1].texture, item[1].options, item[1].data)
	})


	function createBlock(id, name, type, texture, options, data) {
		if (type == 0) {
			var mat = []
			if (options.opaque == false) var txtTransparent = true
			else txtTransparent = false
			if (texture.length == 1 && options.material == undefined) {
				if ( (texture[0].startsWith('http://') || texture[0].startsWith('https://')  ) && game.allowCustom == true) noa.registry.registerMaterial(name, [0, 0, 0], texture[0], txtTransparent)
				else noa.registry.registerMaterial(name, [0, 0, 0], 'textures/' + texture[0] + '.png', txtTransparent)
				mat = name
			} else if (options.material == undefined){
				for (var x = 0; x < texture.length; x++) {
					if ( (texture[x].startsWith('http://') || texture[x].startsWith('https://') ) && game.allowCustom == true) noa.registry.registerMaterial(name + x, [0, 0, 0], texture[x], txtTransparent)
					else noa.registry.registerMaterial(name  + x, [0, 0, 0], 'textures/' + texture[x] + '.png', txtTransparent)
					mat.push(name + x)
				}
			} else { mat = options.material}
			var finOpts = options
			finOpts.material = mat
			noa.registry.registerBlock(id, finOpts)

		} else if (type == 1) {
			var mesh = makePlantSpriteMesh(noa, scene, texture[0], name)
			var finOpts = options
			finOpts.blockMesh = mesh
			noa.registry.registerBlock(id, finOpts)
		} else if (type == 2) {
			var mesh = makeCactusMesh(noa, scene, [texture[0], texture[1]], name)
			var finOpts = options
			finOpts.blockMesh = mesh
			noa.registry.registerBlock(id, finOpts)
		} else if (type == 4) {
			var mat = noa.rendering.makeStandardMaterial(name)

			if ( (texture[0].startsWith('http://') || texture[0].startsWith('https://') ) && game.allowCustom == true) var tex = new BABYLON.Texture(texture[0], scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
			else var tex = new BABYLON.Texture('textures/' + texture[0] + '.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
			
			mat.diffuseTexture = tex
			mat.opacityTexture = mat.diffuseTexture
			mat.backFaceCulling = true

			var mesh = BABYLON.MeshBuilder.CreateBox(name, {size: 1}, noa.rendering.getScene())
			mesh.material = mat
			mesh.bakeTransformIntoVertices( ( new BABYLON.Matrix.Scaling(1, 1, 1) ).setTranslation ( new BABYLON.Vector3(0, 0.5, 0) ) )
			mesh.opaque = false
			mesh.material.needDepthPrePass = true

			var finOpts = options
			finOpts.blockMesh = mesh
			noa.registry.registerBlock(id, finOpts)
		}
	}
}


export function registerItems(noa, itemList) {
	items = itemList
	console.log('Items: ', Object.keys(itemList))
}



function makePlantSpriteMesh(noa, scene, url, name) {
	var matname = name || 'sprite-mat'
	if ( (url.startsWith('http://') || url.startsWith('https://') ) && game.allowCustom == true) var tex = new BABYLON.Texture(url, scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
	else var tex = new BABYLON.Texture('textures/' + url + '.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
	tex.hasAlpha = true
	var mesh = BABYLON.Mesh.CreatePlane('sprite-' + matname, 1, scene)
	var mat = noa.rendering.makeStandardMaterial(matname)
	mat.backFaceCulling = false
	mat.diffuseTexture = tex
	mat.diffuseTexture.vOffset = 0.99	
	mesh.material = mat
	mesh.rotation.y += 0.81

	var offset = BABYLON.Matrix.Translation(0, 0.5, 0)
	mesh.bakeTransformIntoVertices(offset)
	var clone = mesh.clone()
	clone.rotation.y += 1.62

	return BABYLON.Mesh.MergeMeshes([mesh, clone], true)
}


function makeCactusMesh(noa, scene, url, name) {
	var mesh = {}
	var mat = {}
	for (var x = 0; x < 6; x++) {
		var matname = name + '-' + x || 'sprite-mat'
		mesh[x] = BABYLON.Mesh.CreatePlane('sprite-' + matname, 1, scene)
		mat[x] = noa.rendering.makeStandardMaterial(matname + x)
		mat[x].backFaceCulling = false
		if ( ( ( (x < 4) ? url[1] : url[0]).startsWith('http://') || ( (x < 4) ? url[1] : url[0]).startsWith('https://') ) && game.allowCustom == true) mat[x].diffuseTexture = new BABYLON.Texture( ((x < 4) ? url[1] : url[0]), scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
		else  mat[x].diffuseTexture = new BABYLON.Texture('textures/' + ((x < 4) ? url[1] : url[0]) + '.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
		
		mat[x].diffuseTexture.hasAlpha = true
		mesh[x].material = mat[x]
		var offset
		if (x == 0) {offset = BABYLON.Matrix.Translation(0, 0.5, 0.435); mesh[x].rotation.y = 1.57}
		else if (x == 1) {offset = BABYLON.Matrix.Translation(0, 0.5, -0.435); mesh[x].rotation.y = 1.57}
		else if (x == 2) {offset = BABYLON.Matrix.Translation(0, 0.5, 0.435);}
		else if (x == 3) {offset = BABYLON.Matrix.Translation(0, 0.5, -0.435);}
		else if (x == 4) {offset = BABYLON.Matrix.Translation(0, 0, -1); mesh[x].rotation.x = 1.57}
		else if (x == 5) {offset = BABYLON.Matrix.Translation(0, 0, 0); mesh[x].rotation.x = 1.57}

		mesh[x].bakeTransformIntoVertices(offset)
	}
	
	var newmesh = BABYLON.Mesh.MergeMeshes(Object.values(mesh), true, true, undefined, false, false)

	return newmesh

}
