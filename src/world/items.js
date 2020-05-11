
import { Texture } from '@babylonjs/core/Materials/Textures'
import { WaterMaterial } from '@babylonjs/materials/water/waterMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'

// Register items

export function initItems(noa) {
	var scene = noa.rendering.getScene()
	var block = game.blocks
	var itemIDs = {}

	//Format of createItem - id, name, type, texture, attributes

	// Tools

	itemIDs.iron_pickaxe = createItem('iron_pickaxe', 'Iron pickaxe', 'pickaxe', 'item/iron_pickaxe', {stack: 1, power: 3})

	itemIDs.iron_axe = createItem('iron_axe', 'Iron axe', 'axe', 'item/iron_axe', {stack: 1, power: 3})

	itemIDs.iron_shovel = createItem('iron_shovel', 'Iron shovel', 'shovel', 'item/iron_shovel', {stack: 1, power: 3})

	// Resources

	itemIDs.coal = createItem('coal', 'Coal', 'item', 'item/coal', {stack: 64})

	// Blocks

	itemIDs.stone = createItem('stone', 'Stone', 'block', 'block/stone', {stack: 64})
	itemIDs.dirt = createItem('dirt', 'Dirt', 'block', 'block/dirt', {stack: 64})
	itemIDs.grass = createItem('grass', 'Grass block', 'block', 'block/grass_side', {stack: 64})
	itemIDs.grass_snow = createItem('grass_snow', 'Snowy grass block', 'block', 'block/grass_snow', {stack: 64})
	itemIDs.cobblestone = createItem('cobblestone', 'Cobblestone', 'block', 'block/cobblestone', {stack: 64})
	itemIDs.log = createItem('log', 'Log', 'block', 'block/log', {stack: 64})
	itemIDs.sand = createItem('sand', 'Sand', 'block', 'block/sand', {stack: 64})
	itemIDs.leaves = createItem('leaves', 'Leaves', 'block', 'block/leaves', {stack: 64})

	itemIDs.red_flower = createItem('red_flower', 'Poppy', 'block', 'block/red_flower', {stack: 64})
	itemIDs.grass_plant = createItem('grass_plant', 'Grass', 'block', 'block/grass_plant', {stack: 64})
	itemIDs.yellow_flower = createItem('yellow_flower', 'Dandelion', 'block', 'block/yellow_flower', {stack: 64})
	itemIDs.deadbush = createItem('deadbush', 'Dead bush', 'block', 'block/deadbush', {stack: 64})


	itemIDs.bricks = createItem('bricks', 'Bricks', 'block', 'block/bricks', {stack: 64})
	itemIDs.planks = createItem('planks', 'Planks', 'block', 'block/planks', {stack: 64})
	itemIDs.glass = createItem('glass', 'Glass', 'block', 'block/glass', {stack: 64})
	itemIDs.bookshelf = createItem('bookshelf', 'Bookshelf', 'block', 'block/bookshelf', {stack: 64})
	itemIDs.snow = createItem('snow', 'Snow block', 'block', 'block/snow', {stack: 64})
	itemIDs.coal_ore = createItem('coal_ore', 'Coal ore', 'block', 'block/coal_ore', {stack: 64})
	itemIDs.iron_ore = createItem('iron_ore', 'Iron ore', 'block', 'block/iron_ore', {stack: 64})

	itemIDs.cactus = createItem('cactus', 'Cactus', 'block', 'block/cactus_side', {stack: 64})



	return itemIDs
	
	function createItem(id, name, type, texture, data) { // Saving itemdata to game.itemdata
		game.itemdata[id] = {name: name, type: type, texture: texture, data: data}
		return id
	}

}


// Get item's texture
export function getItemTexture(item) {
	if (game.itemdata[item].texture != undefined) return game.itemdata[item].texture
	else return 'error'
}

//Get item's data (attributes))
export function getItemData(item) {
	if (game.itemdata[item].data != undefined) return game.itemdata[item].data
	else return {}
}

// Get item's' max stack size
export function getItemMaxStack(item) {
	if (game.itemdata[item].data.stack > 0) return game.itemdata[item].data.stack
	else Infinity
}

// Get item's name
export function getItemName(item) {
	try { return game.itemdata[item].name }
	catch { return false }
}

// Get item's type
export function getItemType(item) {
	if (game.itemdata[item].type != undefined) return game.itemdata[item].type
	else 'item'
}
