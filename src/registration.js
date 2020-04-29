
import { Texture } from '@babylonjs/core/Materials/Textures'
import { WaterMaterial } from '@babylonjs/materials/water/waterMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'




/*
 * 
 *		Register a bunch of blocks and materials and whatnot
 * 
*/

export function initRegistration(noa) {
	var scene = noa.rendering.getScene()
	// block materials

	noa.registry.registerMaterial('stone', [0, 0, 0], 'block/stone.png')
	noa.registry.registerMaterial('grass_top', [0, 0, 0], 'block/grass_top.png')
	noa.registry.registerMaterial('grass_snow', [0, 0, 0], 'block/grass_snow.png')
	noa.registry.registerMaterial('grass_side', [0, 0, 0], 'block/grass_side.png')
	noa.registry.registerMaterial('dirt', [0, 0, 0], 'block/dirt.png')
	noa.registry.registerMaterial('cobblestone', [0, 0, 0], 'block/cobblestone.png')
	noa.registry.registerMaterial('log_top', [0, 0, 0], 'block/log_top.png')
	noa.registry.registerMaterial('log_side', [0, 0, 0], 'block/log.png')
	noa.registry.registerMaterial('sand', [0, 0, 0], 'block/sand.png')
	noa.registry.registerMaterial('leaves', [0, 0, 0], 'block/leaves.png', true)
	noa.registry.registerMaterial('yellow_flower', [0, 0, 0], 'block/yellow_flower.png', true)
	noa.registry.registerMaterial('grass_plant', [0, 0, 0], 'block/grass_plant.png', true)

	noa.registry.registerMaterial('water', [0.5, 0.5, 0.8, 0.7], null, true)
	noa.registry.registerMaterial('bricks', [0, 0, 0], 'block/bricks.png')
	noa.registry.registerMaterial('planks', [0, 0, 0], 'block/planks.png')
	noa.registry.registerMaterial('glass', [0, 0, 0], 'block/glass.png', true)
	noa.registry.registerMaterial('bookshelf', [0, 0, 0], 'block/bookshelf.png')
	noa.registry.registerMaterial('barrier', [0, 0, 0, 0], null)
	noa.registry.registerMaterial('snow', [0, 0, 0], 'block/snow.png')
	noa.registry.registerMaterial('coal', [0, 0, 0], 'block/coal.png')
	noa.registry.registerMaterial('iron', [0, 0, 0], 'block/iron.png')
	noa.registry.registerMaterial('red_flower', [0, 0, 0], 'block/red_flower.png', true)


	// do some Babylon.js stuff with the scene, materials, etc.



	// block types registration
	var blockIDs = {}
	var _id = 1

	blockIDs.stone = noa.registry.registerBlock(_id++, { material: 'stone' })
	blockIDs.dirt = noa.registry.registerBlock(_id++, { material: 'dirt' })
	blockIDs.grass = noa.registry.registerBlock(_id++, { material: ['grass_top', 'dirt', 'grass_side'] })
	blockIDs.grass_snow = noa.registry.registerBlock(_id++, { material: ['snow', 'dirt', 'grass_snow'] })
	blockIDs.cobblestone = noa.registry.registerBlock(_id++, { material: 'cobblestone' })
	blockIDs.log = noa.registry.registerBlock(_id++, { material: ['log_top', 'log_side'] })
	blockIDs.sand = noa.registry.registerBlock(_id++, { material: 'sand' })
	blockIDs.leaves = noa.registry.registerBlock(_id++, { material: 'leaves', opaque: false })

	blockIDs.water = noa.registry.registerBlock(_id++, { material: 'water', fluid: true, fluidDensity: 5.0, viscosity: 10.5 })

	var redFlowerMesh = makePlantSpriteMesh(scene, 'textures/block/red_flower.png', 'red_flower')
	blockIDs.red_flower = noa.registry.registerBlock(_id++, {
		solid: false, opaque: false,
		blockMesh: redFlowerMesh, material: 'red_flower',
	})

	var grasspltMesh = makePlantSpriteMesh(scene, 'textures/block/grass_plant.png', 'grass_plant')
	blockIDs.grass_plant = noa.registry.registerBlock(_id++, {
		solid: false, opaque: false,
		blockMesh: grasspltMesh, material: 'grass_plant',
	})

	var yellowFlowerMesh = makePlantSpriteMesh(scene, 'textures/block/yellow_flower.png', 'yellow_flower')
	blockIDs.yellow_flower = noa.registry.registerBlock(_id++, {
		solid: false, opaque: false,
		blockMesh: yellowFlowerMesh, material: 'yellow_flower',
	})

	blockIDs.bricks = noa.registry.registerBlock(_id++, { material: 'bricks' })
	blockIDs.planks = noa.registry.registerBlock(_id++, { material: 'planks' })
	blockIDs.glass = noa.registry.registerBlock(_id++, { material: 'glass', opaque: false })
	blockIDs.bookshelf = noa.registry.registerBlock(_id++, { material: ['planks', 'bookshelf'] })
	blockIDs.barrier = noa.registry.registerBlock(_id++, { material: 'barrier', opaque: false })
	blockIDs.snow = noa.registry.registerBlock(_id++, { material: 'snow'})
	blockIDs.coal = noa.registry.registerBlock(_id++, { material: 'coal'})
	blockIDs.iron = noa.registry.registerBlock(_id++, { material: 'iron'})


	return blockIDs
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

