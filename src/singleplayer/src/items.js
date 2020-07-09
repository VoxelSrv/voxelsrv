var items = {}

module.exports = {
	init() { initItems() },
	get() { return items },
	getStack(id) { return getItemMaxStack(id) }
}

function initItems() {

	//Format of createItem - id, name, type, texture, attributes

	// Tools

	//itemIDs.iron_pickaxe = createItem('iron_pickaxe', 'Iron pickaxe', 'pickaxe', 'item/iron_pickaxe', {stack: 1, power: 3})

	//itemIDs.iron_axe = createItem('iron_axe', 'Iron axe', 'axe', 'item/iron_axe', {stack: 1, power: 3})

	//itemIDs.iron_shovel = createItem('iron_shovel', 'Iron shovel', 'shovel', 'item/iron_shovel', {stack: 1, power: 3})

	// Resources

	//itemIDs.coal = createItem('coal', 'Coal', 'item', 'item/coal', {stack: 64})

	// Blocks

	createItem('stone', 'Stone', 'block', 'block/stone', {stack: 64})
	createItem('dirt', 'Dirt', 'block', 'block/dirt', {stack: 64})
	createItem('grass', 'Grass block', 'block', 'block/grass_side', {stack: 64})
	createItem('grass_snow', 'Snowy grass block', 'block', 'block/grass_snow', {stack: 64})
	createItem('cobblestone', 'Cobblestone', 'block', 'block/cobblestone', {stack: 64})
	createItem('log', 'Log', 'block', 'block/log', {stack: 64})
	createItem('sand', 'Sand', 'block', 'block/sand', {stack: 64})
	createItem('leaves', 'Leaves', 'block', 'block/leaves', {stack: 64})

	createItem('red_flower', 'Poppy', 'block-flat', 'block/red_flower', {stack: 64})
	createItem('grass_plant', 'Grass', 'block-flat', 'block/grass_plant', {stack: 64})
	createItem('yellow_flower', 'Dandelion', 'block-flat', 'block/yellow_flower', {stack: 64})
	//itemIDs.deadbush = createItem('deadbush', 'Dead bush', 'block-flat', 'block/deadbush', {stack: 64})


	createItem('bricks', 'Bricks', 'block', 'block/bricks', {stack: 64})
	createItem('planks', 'Planks', 'block', 'block/planks', {stack: 64})
	createItem('glass', 'Glass', 'block', 'block/glass', {stack: 64})
	createItem('bookshelf', 'Bookshelf', 'block', 'block/bookshelf', {stack: 64})
	createItem('snow', 'Snow block', 'block', 'block/snow', {stack: 64})
	createItem('coal_ore', 'Coal ore', 'block', 'block/coal_ore', {stack: 64})
	createItem('iron_ore', 'Iron ore', 'block', 'block/iron_ore', {stack: 64})

	createItem('cactus', 'Cactus', 'block', 'block/cactus_side', {stack: 64})
	//itemIDs.cactus = createItem('cactus', 'Cactus', 'block', 'block/cactus_side', {stack: 64})

	createItem('stonebrick', 'Stone brick', 'block', 'block/stonebrick', {stack: 64})


	var colors = ['white', 'yellow', 'red', 'purple', 'pink', 'orange', 'magenta', 'lime', 'light_blue', 'green', 'gray', 'cyan', 'brown', 'blue', 'black']


	colors.forEach(function(color) {
		createItem(color + '_wool', color + '_wool', 'block', 'block/'+ color + '_wool', {stack: 64})
	})
	colors.forEach(function(color) {
		createItem(color + '_stained_glass', color + '_stained_glass', 'block', 'block/'+ color + '_stained_glass', {stack: 64})
	})

	createItem('birch_leaves', 'Birch leaves', 'block', 'block/birch_leaves', {stack: 64})
	createItem('birch_log', 'Birch log', 'block', 'block/birch_log', {stack: 64})
	createItem('birch_planks', 'Birch planks', 'block', 'block/birch_planks', {stack: 64})

	createItem('spruce_leaves', 'Spruce leaves', 'block', 'block/spruce_leaves', {stack: 64})
	createItem('spruce_log', 'Spruce log', 'block', 'block/spruce_log', {stack: 64})
	createItem('spruce_planks', 'Spruce planks', 'block', 'block/spruce_planks', {stack: 64})

	createItem('iron_block', 'Iron block', 'block', 'block/iron_block', {stack: 64})
	createItem('gold_block', 'Gold block', 'block', 'block/gold_block', {stack: 64})

	createItem('crafting', 'Crafting table', 'block', 'block/crafting_table_top', {stack: 64})




	function createItem(id, name, type, texture, data) { // Saving items to items
		items[id] = {name: name, type: type, texture: texture, data: data}
		return id
	}

}


// Get item's texture
function getItemTexture(item) {
	if (items[item] != undefined && items[item].texture != undefined) return items[item].texture
	else return 'error'
}

//Get item's data (attributes))
function getItemData(item) {
	if (items[item] != undefined && items[item].data != undefined) return items[item].data
	else return {}
}

// Get item's' max stack size
function getItemMaxStack(item) {
	if (items[item] != undefined && items[item].data.stack > 0) return items[item].data.stack
	else Infinity
}

// Get item's name
function getItemName(item) {
	try { return items[item].name }
	catch { return false }
}

// Get item's type
function getItemType(item) {
	if (items[item] != undefined && items[item].type != undefined) return items[item].type
	else 'item'
}
