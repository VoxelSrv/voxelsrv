
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
	var item = game.items

	// block types registration
	var blockIDs = {}
	var _id = 1

	blockIDs.stone = createBlock(_id++, 'stone', 0, ['block/stone'], {}, {drop: item.cobblestone})
	blockIDs.dirt = createBlock(_id++, 'dirt', 0, ['block/dirt'], {}, {drop: item.dirt})
	blockIDs.grass = createBlock(_id++, 'grass', 0, ['block/grass_top', 'block/dirt', 'block/grass_side'], {}, {drop: item.dirt})
	blockIDs.grass_snow = createBlock(_id++, 'grass_snow', 0, ['block/snow', 'block/dirt', 'block/grass_snow'], {}, {drop: item.dirt})
	blockIDs.cobblestone = createBlock(_id++, 'cobblestone', 0, ['block/cobblestone'], {}, {drop: item.cobblestone})
	blockIDs.log = createBlock(_id++, 'log', 0, ['block/log_top', 'block/log'], {}, {drop: item.log})
	blockIDs.sand = createBlock(_id++, 'sand', 0, ['block/sand'], {}, {drop: item.sand})
	blockIDs.leaves = createBlock(_id++, 'leaves', 0, ['block/leaves'], {opaque: false}, {drop: item.leaves})

	noa.registry.registerMaterial('water', [0.5, 0.5, 0.8, 0.7], null, true)
	blockIDs.water = createBlock(_id++, 'water', 0, ['block/water'], {material: 'water', fluid: true, fluidDensity: 5.0, viscosity: 10.5 }, {} )

	blockIDs.red_flower = createBlock(_id++, 'red_flower', 1, ['block/red_flower'], {solid: false, opaque: false}, {drop: item.red_flower})
	blockIDs.grass_plant = createBlock(_id++, 'grass_plant', 1, ['block/grass_plant'], {solid: false, opaque: false}, {drop: item.grass_plant})
	blockIDs.yellow_flower = createBlock(_id++, 'yellow_flower', 1, ['block/yellow_flower'], {solid: false, opaque: false}, {drop: item.yellow_flower})

	blockIDs.bricks = createBlock(_id++, 'bricks', 0, ['block/bricks'], {}, {drop: item.bricks})
	blockIDs.planks = createBlock(_id++, 'planks', 0, ['block/planks'], {}, {drop: item.planks})
	blockIDs.glass = createBlock(_id++, 'glass', 0, ['block/glass'], {}, {drop: item.glass})
	blockIDs.bookshelf = createBlock(_id++, 'bookshelf', 0, ['block/planks', 'block/bookshelf'], {}, {drop: item.bookshelf})

	noa.registry.registerMaterial('barrier', [0.0, 0.0, 0.0, 0.2], null, true)
	blockIDs.barrier = createBlock(_id++, 'barrier', 0, [], {material: 'barrier'}, {illegal: true, unbreakable: true})

	blockIDs.snow = createBlock(_id++, 'snow', 0, ['block/snow'], {}, {drop: item.snow})
	blockIDs.coal_ore = createBlock(_id++, 'coa_ore', 0, ['block/coal_ore'], {}, {drop: item.coal})
	blockIDs.iron_ore = createBlock(_id++, 'iron_ore', 0, ['block/iron_ore'], {}, {drop: item.iron_ore})


	return blockIDs
	
	function createBlock(id, name, type, texture, options, data) {
		if (type == 0) {
			var mat = []
			if (texture.length == 1 && options.material == undefined) {
				noa.registry.registerMaterial(name, [0, 0, 0], texture[0] + '.png', true)
				mat = name
			} else if (options.material == undefined){
				for (var x = 0; x < texture.length; x++) {
					noa.registry.registerMaterial(name + x, [0, 0, 0], texture[x] + '.png', true)
					mat.push(name + x)
				}
			} else { mat = options.material}
			game.blockdata[id] = {
				name: name,
				mesh: mesh,
				options: options,
				textures: texture,
				data: data,
				type: 0
			}
			var finOpts = options
			finOpts.material = mat
			noa.registry.registerBlock(id, finOpts)

		} else if (type == 1) {
			noa.registry.registerMaterial(name, [0, 0, 0], texture[0])
			var mesh = makePlantSpriteMesh(scene, 'textures/' + texture[0] + '.png', name)
			game.blockdata[id] = {
				name: name,
				mesh: mesh,
				options: options,
				textures: texture,
				data: data,
				type: 1
			}
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
	mesh.material = mat
	mesh.rotation.y += 0.81

	var offset = BABYLON.Matrix.Translation(0, 0.5, 0)
	mesh.bakeTransformIntoVertices(offset)
	var clone = mesh.clone()
	clone.rotation.y += 1.62

	return BABYLON.Mesh.MergeMeshes([mesh, clone], true)
}

