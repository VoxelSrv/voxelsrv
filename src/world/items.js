
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

	itemIDs.stone = createItem('stone', 'Stone', 0, 'block/stone', {stack: 64})
	itemIDs.dirt = createItem('dirt', 'Dirt', 0, 'block/dirt', {stack: 64})
	itemIDs.grass = createItem('grass', 'Grass block', 0, 'block/grass_side', {stack: 64})
	itemIDs.grass_snow = createItem('grass_snow', 'Snowy grass block', 0, 'block/grass_snow', {stack: 64})
	itemIDs.cobblestone = createItem('cobblestone', 'Cobblestone', 0, 'block/cobblestone', {stack: 64})
	itemIDs.log = createItem('log', 'Log', 0, 'block/log', {stack: 64})
	itemIDs.sand = createItem('sand', 'Sand', 0, 'block/sand', {stack: 64})
	itemIDs.leaves = createItem('leaves', 'Leaves', 0, 'block/leaves', {stack: 64})

	itemIDs.red_flower = createItem('red_flower', 'Poppy', 0, 'block/red_flower', {stack: 64})
	itemIDs.grass_plant = createItem('grass_plant', 'Grass', 0, 'block/grass_plant', {stack: 64})
	itemIDs.yellow_flower = createItem('yellow_flower', 'Dandelion', 0, 'block/yellow_flower', {stack: 64})

	itemIDs.bricks = createItem('bricks', 'Bricks', 0, 'block/bricks', {stack: 64})
	itemIDs.planks = createItem('planks', 'Planks', 0, 'block/planks', {stack: 64})
	itemIDs.glass = createItem('glass', 'Glass', 0, 'block/glass', {stack: 64})
	itemIDs.bookshelf = createItem('bookshelf', 'Bookshelf', 0, 'block/bookshelf', {stack: 64})
	itemIDs.snow = createItem('snow', 'Snow block', 0, 'block/snow', {stack: 64})
	itemIDs.coal_ore = createItem('coal_ore', 'Coal ore', 0, 'block/coal_ore', {stack: 64})
	itemIDs.iron_ore = createItem('iron_ore', 'Iron ore', 0, 'block/iron_ore', {stack: 64})

	itemIDs.iron_pickaxe = createItem('iron_pickaxe', 'Iron pickaxe', 1, 'item/iron_pickaxe', {stack: 1})

	itemIDs.coal = createItem('coal', 'Coal', 1, 'item/coal', {stack: 64})

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

