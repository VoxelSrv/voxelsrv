
import { Texture } from '@babylonjs/core/Materials/Textures'
import { WaterMaterial } from '@babylonjs/materials/water/waterMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'

/*
 * 
 *		Register a bunch of blocks and materials and whatnot
 * 
*/

export function initItems(noa) {
	var scene = noa.rendering.getScene()
	var block = game.blocks
	// block types registration
	var itemIDs = {}
	var _id = 1

	itemIDs.stone = createItem(_id++, 'stone', 0, 'block/stone', {stack: 64})
	itemIDs.dirt = createItem(_id++, 'dirt', 0, 'block/dirt', {stack: 64})
	itemIDs.grass = createItem(_id++, 'grass', 0, 'block/grass_side', {stack: 64})
	itemIDs.grass_snow = createItem(_id++, 'grass_snow', 0, 'block/grass_snow', {stack: 64})
	itemIDs.cobblestone = createItem(_id++, 'cobblestone', 0, 'block/cobblestone', {stack: 64})
	itemIDs.log = createItem(_id++, 'log', 0, 'block/log', {stack: 64})
	itemIDs.sand = createItem(_id++, 'sand', 0, 'block/sand', {stack: 64})
	itemIDs.leaves = createItem(_id++, 'leaves', 0, 'block/leaves', {stack: 64})

	itemIDs.red_flower = createItem(_id++, 'red_flower', 0, 'block/red_flower', {stack: 64})
	itemIDs.grass_plant = createItem(_id++, 'grass_plant', 0, 'block/grass_plant', {stack: 64})
	itemIDs.yellow_flower = createItem(_id++, 'yellow_flower', 0, 'block/yellow_flower', {stack: 64})

	itemIDs.bricks = createItem(_id++, 'bricks', 0, 'block/bricks', {stack: 64})
	itemIDs.planks = createItem(_id++, 'planks', 0, 'block/planks', {stack: 64})
	itemIDs.glass = createItem(_id++, 'glass', 0, 'block/glass', {stack: 64})
	itemIDs.bookshelf = createItem(_id++, 'bookshelf', 0, 'block/bookshelf', {stack: 64})
	itemIDs.snow = createItem(_id++, 'snow', 0, 'block/snow', {stack: 64})
	itemIDs.coal_ore = createItem(_id++, 'coal_ore', 0, 'block/coal_ore', {stack: 64})
	itemIDs.iron_ore = createItem(_id++, 'iron_ore', 0, 'block/iron_ore', {stack: 64})

	itemIDs.iron_pickaxe = createItem(_id++, 'iron_pickaxe', 1, 'item/iron_pickaxe', {stack: 1})

	itemIDs.coal = createItem(_id++, 'coal', 1, 'item/coal', {stack: 64})

	return itemIDs
	
	function createItem(id, name, type, texture, data) {
		game.itemdata[id] = {name: name, type: type, texture: texture, data: data}
		return id
	}

}



export function getItemNames(itemIDs) {
	var itemNames = {}
	var x = 0
	for (let [key, value] of Object.entries(itemIDs)) {
		itemNames[value] = key
	}
	return itemNames
}

