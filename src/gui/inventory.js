import { isMobile } from 'mobile-device-detect'

const protocol = require('../protocol')

var hotbar = {}

export async function setupHotbar(noa, send) {
	var eid = noa.playerEntity
	var inventory = noa.ents.getState(eid, 'inventory')
	game.hotbarsize = isMobile ? 7 : 9

	var div = document.createElement('table')
	div.classList.add('hotbar')
	div.id = 'game_hotbar'
	document.body.appendChild(div)
	var row = document.createElement('tr')

	for (var x = 0; x < game.hotbarsize; x++) { //Create hotbar items
		hotbar[x] = document.createElement('th')
		hotbar[x].id = x
		hotbar[x].addEventListener('click', function(){
			send('actionInventoryClick', {slot: parseInt(this.id), type: 'select'} )
			noa.ents.getState(eid, 'inventory').selected = parseInt(this.id) 
		})
		hotbar[x].classList.add('hotbar_item')
		hotbar[x].innerHTML = await renderItem( inventory.main[x] )
		row.appendChild(hotbar[x])
	}
	if (isMobile) {
		var invButton = document.createElement('th')
		invButton.id = 'hotbar_invbutton'
		invButton.addEventListener('click', function(){ 
			var inv = document.getElementById('game_inventory_screen')
			var input = document.getElementById('game_chatinput')

			if (input.style.display != 'none') {}
			else if (inv.style.display == 'none') {
				inv.style.display = 'initial'
			}
		} )
		row.appendChild(invButton)
	}

	div.appendChild(row)
	var inv = {}
	var sel = inventory.selected
	noa.on('tick', async function() { //Hotbar updates
		var newsel = inventory.selected
		var newinv = Object.values(inventory.main)
		if (newsel != sel || JSON.stringify(inv) != JSON.stringify(newinv) ) {
			inv = [...newinv]
			sel = inventory.selected
			for (var x = 0; x < game.hotbarsize; x++) {
				if (x == sel && !hotbar[x].classList.contains('hotbar_selected')) hotbar[x].classList.add('hotbar_selected')
				else if (x != sel && hotbar[x].classList.contains('hotbar_selected'))  hotbar[x].classList.remove('hotbar_selected')
			}
		}
	});
}

var tempslot = {}
var invslot = {}
var inventoryscreen

export async function setupInventory(noa, send) { // Opens inventory
	var inventory = noa.ents.getState(1, 'inventory')
	var invItems = Object.entries(inventory.main)
	var inv = inventory.main
	inventory.bin = {}
	
	var screen = document.createElement('div') // Main screen (blocks integration with canvas)
	inventoryscreen = screen
	screen.id = 'game_inventory_screen'
	screen.style.display = 'none'
	document.body.appendChild(screen)


	var invGui = document.createElement('table') // Inventory table
	invGui.id = 'game_inventory'
	screen.appendChild(invGui)
	var hotbar = {}
	var slot = 9

	var backpack = document.createElement('div') // Backpack Inventory
	backpack.id = 'game_inventory_backpack'

	invGui.appendChild(backpack)


	tempslot = document.createElement('div') // Item at cursor
	tempslot.id = 'tempslot'
	tempslot.classList.add('align-bottom')
	tempslot.classList.add('inventory_temp')
	tempslot.innerHTML = await renderItem(inventory.tempslot)

	screen.appendChild(tempslot)

	if (isMobile) { // Mobile exit button
		var invExit = document.createElement('div')
		invExit.id = 'game_inventory_exit'
		invExit.addEventListener('click', function(){ 
			var inv = document.getElementById('game_inventory_screen')
			inv.style.display = 'none'
		} )
		screen.appendChild(invExit)
	}

	for (var x = 0; x < (invItems.length/9)-1; x++) { // Inventory slots (backpack)
		var row = document.createElement('tr')
		backpack.appendChild(row)
		for (var y = 0; y < 9; y++) {
			invslot[slot] = document.createElement('th')
			invslot[slot].id = slot
			invslot[slot].addEventListener( 'click', function(){ send('actionInventoryClick', {type: 'left', slot: parseInt(this.id)}) } )
			invslot[slot].addEventListener( 'contextmenu', function(){ send('actionInventoryClick', {type: 'right', slot: parseInt(this.id)}); return false  } )
			invslot[slot].classList.add('inventory_item')
			invslot[slot].innerHTML = await renderItem(inv[slot])
			row.appendChild(invslot[slot])
			slot = slot + 1
		}
	}

	var row_hotbar = document.createElement('tr')
	row_hotbar.id = 'game_inventory_hotbar'
	invGui.appendChild(row_hotbar)
	
	for (var x = 0; x < 9; x++) { // Inventory slots (hotbar)
		invslot[x] = document.createElement('th')
		invslot[x].id = x
		invslot[x].classList.add('inventory_item_hotbar')
		invslot[x].addEventListener( 'click', function(){ send('actionInventoryClick', {type: 'left', slot: parseInt(this.id) }) } )
		invslot[x].addEventListener( 'contextmenu', function(){ send('actionInventoryClick', {type: 'right', slot: parseInt(this.id) }); return false  } )
		invslot[x].innerHTML = await renderItem(inv[x])
		row_hotbar.appendChild(invslot[x])
	}


	var tooltip = document.createElement('div') // Item at cursor
	tooltip.id = 'game_tooltip'
	tooltip.classList.add('item_tooltip')

	screen.appendChild(tooltip)



	window.addEventListener("mousemove", function(e){ //Moving items at cursor
		if (screen.style.display != 'none') {
			tempslot.style.left = e.x + 'px'
			tempslot.style.top = e.y + 'px'

			var slot = document.elementFromPoint(e.x, e.y).id
			var inv2 = noa.ents.getState(1, 'inventory').main

			if (inv2[slot] != undefined && inv2[slot].id != undefined) {
				tooltip.style.left = e.x + 20 + 'px'
				tooltip.style.top = e.y - 10 + 'px'

				tooltip.innerHTML = items[inv2[slot].id].name
				tooltip.style.display = 'initial'
			}
			else tooltip.style.display = 'none'
		}
	});


}


var oldInv = '{}'

export async function updateInventory(noa) { // Update slots
	if (inventoryscreen.style.display != 'none') {
		var inventory = noa.ents.getState(noa.playerEntity, 'inventory')
		var inv = inventory.main

		var json = JSON.stringify(inv)
		if (json != oldInv) {
			oldInv = json
			for (var x = 0; x < Object.entries(inv).length; x++) {
				let item = await renderItem(inv[x])
				invslot[x].innerHTML = item
				if (slot < game.hotbarsize) hotbar[slot].innerHTML = item
			}
			tempslot.innerHTML = await renderItem(inventory.tempslot)
		}
	}
}

export async function updateHotbar(noa) { // Update slots
	var inventory = noa.ents.getState(noa.playerEntity, 'inventory')
	var inv = inventory.main

	for (var x = 0; x < game.hotbarsize; x++) {
		hotbar[slot].innerHTML = await renderItem(inv[x])
	}
}

export async function updateSlot(noa, slot, type) { // Update slots
	var inventory = noa.ents.getState(noa.playerEntity, 'inventory')
	var inv = inventory.main

	var itemlook = await renderItem( inv[slot] )

	if (type == 'temp') tempslot.innerHTML = await renderItem(inventory.tempslot)
	else {
		if (invslot[slot] != undefined) invslot[slot].innerHTML = itemlook
		if (slot < game.hotbarsize && slot >= 0) { 
			hotbar[slot].innerHTML = itemlook
		}
	}

}

async function renderItem(item) { // Inventory item rendering
	if (item == undefined || item.id == undefined) return ''

	var count = ''
	if (item.count == Infinity) count = 'Inf'
	else if (item.count != 1) count = item.count

	if (items[item.id].type == 'block') {
		var block = blockIDs[item.id]
		var url = new Array(3)
		var preUrl = new Array(3)
		try {
			var txt = blocks[block].texture
			preUrl[0] = txt[txt.length - 1]
			preUrl[1] = txt[txt.length - 1]
			preUrl[2] = txt[0]
		}
		catch { 
			preUrl[0] = 'error'
			preUrl[1] = 'error' 
			preUrl[2] = 'error'
		}

		for(var x = 0; x < 3; x++) {
			if ( (preUrl[x].startsWith('http://') || preUrl[x].startsWith('https://') ) && game.allowCustom == true) url[x] = preUrl[x]
			else url[x] = 'textures/' + preUrl[x] + '.png'
		}

		var x = '<div class="item_icon">' +
					'<div class="cube">' +
						'<div class="cube_face cube_face-right" style="background-image: url('+ url[0] +'"></div>' +
						'<div class="cube_face cube_face-left" style="background-image: url(' + url[1] +'"></div>' +
						'<div class="cube_face cube_face-top" style="background-image: url(' + url[2] + '"></div>' +
					'</div>' + 
				'</div>' + 
				'<div class="item_count float-right">' + count + '</div>'
		return x
	} else {
		try { var txt = items[item.id].texture}
		catch { var txt = 'error' }

		if ( (txt.startsWith('http://') || txt.startsWith('https://')  ) && game.allowCustom == true) var url = txt
		else var url = 'textures/' + txt + '.png'

		return '<div class="item_icon" style="background-image: url(' + url +'"></div><div class="item_count float-right">' + count + '</div>'
	}
}
