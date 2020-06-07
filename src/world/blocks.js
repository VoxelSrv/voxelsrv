
import { Texture } from '@babylonjs/core/Materials/Textures'
import { WaterMaterial } from '@babylonjs/materials/water/waterMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'

/*
 * 
 *		Register a bunch of blocks and materials and whatnot
 * 
*/

export function initBlocks(noa) {
	var scene = noa.rendering.getScene()
	if (game.blocks == undefined) {
		game.blocks = {}
		game.blockIDs = {}
	}	

	// block types registration
	var blockIDs = {}
	var _id = 1

	noa.registry.registerMaterial('water', [0.5, 0.5, 0.8, 0.7], null, true)
	noa.registry.registerMaterial('barrier', [0.0, 0.0, 0.0, 0.0], null, true)

	createBlock(_id++, 'stone', 0, ['block/stone'], {}, {drop: 'cobblestone', hardness: 4, tool: 'pickaxe', power: 1})
	createBlock(_id++, 'dirt', 0, ['block/dirt'], {}, {drop: 'dirt', hardness: 2.5, tool: 'shovel'})
	createBlock(_id++, 'grass', 0, ['block/grass_top', 'block/dirt', 'block/grass_side'], {}, {drop: 'dirt', hardness: 2.5, tool: 'shovel'})
	createBlock(_id++, 'grass_snow', 0, ['block/snow', 'block/dirt', 'block/grass_snow'], {}, {drop: 'dirt', hardness: 2.5, tool: 'shovel'})
	createBlock(_id++, 'cobblestone', 0, ['block/cobblestone'], {}, {drop: 'cobblestone', hardness: 5, tool: 'pickaxe', power: 1})
	createBlock(_id++, 'log', 0, ['block/log_top', 'block/log'], {}, {drop: 'log', hardness: 4, tool: 'axe'})
	createBlock(_id++, 'sand', 0, ['block/sand'], {}, {drop: 'sand', hardness: 2.5, tool: 'shovel'})
	createBlock(_id++, 'leaves', 0, ['block/leaves'], {opaque: false}, {drop: 'leaves'})

	createBlock(_id++, 'water', 0, ['block/water'], {material: 'water', fluid: true, fluidDensity: 20.0, viscosity: 20.5 }, {} )

	createBlock(_id++, 'red_flower', 1, ['block/red_flower'], {solid: false, opaque: false}, {drop: 'red_flower'})
	createBlock(_id++, 'grass_plant', 1, ['block/grass_plant'], {solid: false, opaque: false}, {drop: 'grass_plant'})
	createBlock(_id++, 'yellow_flower', 1, ['block/yellow_flower'], {solid: false, opaque: false}, {drop: 'yellow_flower'})
	createBlock(_id++, 'bricks', 0, ['block/bricks'], {}, {drop: 'bricks', hardness: 3, tool: 'pickaxe', power: 1})
	createBlock(_id++, 'planks', 0, ['block/planks'], {}, {drop: 'planks', hardness: 3, tool: 'axe'})
	createBlock(_id++, 'glass', 0, ['block/glass'], {opaque: false}, {drop: 'glass',  hardness: 2, tool: 'pickaxe'})
	createBlock(_id++, 'bookshelf', 0, ['block/planks', 'block/bookshelf'], {}, {drop: 'bookshelf', hardness: 3, tool: 'axe'})

	createBlock(_id++, 'barrier', 0, [], {material: 'barrier'}, {illegal: true, unbreakable: true, tool: 'admin', power: Infinity})

	createBlock(_id++, 'snow', 0, ['block/snow'], {}, {drop: 'snow', hardness: 2, tool: 'shovel'})
	createBlock(_id++, 'coa_ore', 0, ['block/coal_ore'], {}, {drop: 'coal', hardness: 4.5, tool: 'pickaxe', power: 1})
	createBlock(_id++, 'iron_ore', 0, ['block/iron_ore'], {}, {drop: 'iron_ore', hardness: 5.5, tool: 'pickaxe', power: 2})
	createBlock(_id++, 'cactus', 2, ['block/cactus_top', 'block/cactus_side'], {opaque: false}, {drop: 'cactus', hardness: 3, tool: 'axe'})
	createBlock(_id++, 'deadbush', 1, ['block/deadbush'], {solid: false, opaque: false}, {drop: 'deadbush'})
	createBlock(_id++, 'gravel', 0, ['block/gravel'], {}, {drop: 'gravel', hardness: 2.5, tool: 'shovel'})

	createBlock(_id++, 'crafting', 0, ['block/crafting_top', 'block/planks', 'block/crafting_side'], {}, {drop: 'crafting', hardness: 2, tool: 'axe'})

	
	function createBlock(id, name, type, texture, options, data) {
		if (type == 0) {
			var mat = []
			if (options.opaque == false) var txtTransparent = true
			else txtTransparent = false
			if (texture.length == 1 && options.material == undefined) {
				noa.registry.registerMaterial(name, [0, 0, 0], texture[0] + '.png', txtTransparent)
				mat = name
			} else if (options.material == undefined){
				for (var x = 0; x < texture.length; x++) {
					noa.registry.registerMaterial(name + x, [0, 0, 0], texture[x] + '.png', txtTransparent)
					mat.push(name + x)
				}
			} else { mat = options.material}
			game.blocks[id] = {
				name: name,
				mesh: mesh,
				options: options,
				textures: texture,
				data: data,
				type: 0
			}
			game.blockIDs[name] = id

			var finOpts = options
			finOpts.material = mat
			noa.registry.registerBlock(id, finOpts)

		} else if (type == 1) {
			noa.registry.registerMaterial(name, [0, 0, 0], texture[0])
			var mesh = makePlantSpriteMesh(scene, 'textures/' + texture[0] + '.png', name)
			game.blocks[id] = {
				name: name,
				mesh: mesh,
				options: options,
				textures: texture,
				data: data,
				type: 1
			}
			game.blockIDs[name] = id

			var finOpts = options
			finOpts.blockMesh = mesh
			noa.registry.registerBlock(id, finOpts)
		} else if (type == 2) {
			noa.registry.registerMaterial(name, [0, 0, 0], texture[0])
			var mesh = makeCactusMesh(scene, ['textures/' + texture[0]  + '.png', 'textures/' + texture[1]  + '.png'], name)
			game.blocks[id] = {
				name: name,
				mesh: mesh,
				options: options,
				textures: texture,
				data: data,
				type: 2
			}
			game.blockIDs[name] = id
			var finOpts = options
			finOpts.blockMesh = mesh
			noa.registry.registerBlock(id, finOpts)
		}
		return id
	}

}



export function getBlockNames(blockIDs) {
	var blockNames = {}
	var x = 0
	for (let [key, value] of Object.entries(blockIDs)) {
		blockNames[value] = key
	}
	return blockNames
}

function makePlantSpriteMesh(scene, url, name) {
	var matname = name || 'sprite-mat'
	var tex = new BABYLON.Texture(url, scene, true, true,
	BABYLON.Texture.NEAREST_SAMPLINGMODE)
	tex.hasAlpha = true
	var mesh = BABYLON.Mesh.CreatePlane('sprite-' + matname, 1, scene)
	var mat = new BABYLON.StandardMaterial('sprite-mat-' + matname, scene)
	mat.specularColor = new BABYLON.Color3(0, 0, 0)
	mat.emissiveColor = new BABYLON.Color3(1, 1, 1)
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


function makeCactusMesh(scene, url, name) {
	var mesh = {}
	var mat = {}
	for (var x = 0; x < 6; x++) {
		var matname = name + '-' + x || 'sprite-mat'
		mesh[x] = BABYLON.Mesh.CreatePlane('sprite-' + matname, 1, scene)
		mat[x] = new BABYLON.StandardMaterial('sprite-mat-' + matname, scene)
		mat[x].specularColor = new BABYLON.Color3(0, 0, 0)
		mat[x].emissiveColor = new BABYLON.Color3(1, 1, 1)
		mat[x].backFaceCulling = false
		mat[x].diffuseTexture = new BABYLON.Texture( ((x < 4) ? url[1] : url [0]), scene,
			true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
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

	//var multimat = new BABYLON.MultiMaterial("cactus", scene)
	//multimat.subMaterials = Object.values(mat)

	//newmesh.material = multimat
	return newmesh

}





