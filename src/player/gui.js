import Container from 'noa-engine'
import { Texture } from '@babylonjs/core/Materials/Textures'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'
import { SkyMaterial } from "@babylonjs/materials"
import { getInventory, inventoryLeftClick, inventoryRightClick, getTool } from './player'
import { getItemName } from '../world/items'
import { setupChatbox } from '../gui/chat'


// Setups every gui element
export function setupGUI(noa) {
	setupHotbarGUI()
	setupInfoGUI()
	setupSkybox()
	//setupHand()
	setupCross()
	setupChatbox()
}


// Starts hotbar

function setupHotbarGUI() {
	var eid = noa.playerEntity
	var inventory = getInventory(1)
	game.hotbarsize = 9

	var div = document.createElement('table')
	div.classList.add('hotbar')
	div.id = 'game_hotbar'
	document.body.appendChild(div)
	var row = document.createElement('tr')

	var hotbar = {}
	for (var x = 0; x < game.hotbarsize; x++) { //Create hotbar items
		hotbar[x] = document.createElement('th')
		hotbar[x].id = x
		hotbar[x].addEventListener( 'click', function(){ getInventory(1).selected = parseInt(this.id) } )
		hotbar[x].classList.add('hotbar_item')
		row.appendChild(hotbar[x])
	}
	div.appendChild(row)
	var inv = {}
	var sel = inventory.selected
	noa.on('tick', async function(){ //Hotbar updates
		var newsel = inventory.selected
		var newinv = Object.values(inventory.main)
		if (newsel != sel || JSON.stringify(inv) != JSON.stringify(newinv) ) {
			inv = Object.values(inventory.main)
			sel = inventory.selected
			for (var x = 0; x < game.hotbarsize; x++) {
				if (x == sel && !hotbar[x].classList.contains('hotbar_selected')) hotbar[x].classList.add('hotbar_selected')
				else if (x != sel && hotbar[x].classList.contains('hotbar_selected'))  hotbar[x].classList.remove('hotbar_selected')
				hotbar[x].innerHTML = await renderItem(inv[x])
			}
		}
	});
}

// Creates player's hand
function setupHand() {
	var scene = noa.rendering.getScene()
	var eid = noa.playerEntity
	var hand = BABYLON.MeshBuilder.CreateBox("hand", {size:0.1}, scene)
	var handMaterial = new BABYLON.StandardMaterial("hand", scene)
	hand.material = handMaterial
	hand.parent = scene.activeCamera
	hand.rotation.y = -Math.PI/8
	noa.rendering.addMeshToScene(hand, false)
	noa.on('tick', function() { //Updates Player's hand
		var inventory = getInventory(1)
		var inv =  inventory.main
		var sel = inventory.selected
		try {
			var txt = 'textures/' + game.items[inv[sel].id].texture + '.png'
			hand.position = new BABYLON.Vector3(0.08, -0.08, 0.08);
		} catch {
			var txt = null
			hand.position = new BABYLON.Vector3(99.08, 99.08, 99.08);
		}
		var mat = new BABYLON.Texture(txt, scene, false, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
		handMaterial.ambientTexture = mat
	})
}

// Setups "debug" informations
function setupInfoGUI() {
	var eid = noa.playerEntity
	var dat = noa.entities.getPositionData(eid)
	var playertool = getTool(eid)

	var div = document.createElement('div') // Main div
	div.id = 'game_version'
	var style = 'position:absolute; top:5; left:5; z-index:0;'
	style += 'color:white; text-shadow: 1px 1px black;'
	style += 'font-size:20px; margin:4px;'
	div.style = style
	document.body.appendChild(div)

	var version = document.createElement('span') // Version
	version.innerHTML = game.name + ' ' + game.version +'<br>Noa: ' + noa.version
	div.appendChild(version)

	var world = document.createElement('span') //World
	world.innerHTML = '<br>World: ' + noa.worldName
	div.appendChild(world)

	var pos = document.createElement('span') //Coordinates
	pos.innerHTML = '<br>X: ' + Math.round(dat.position[0]) + ' Y: ' + Math.round(dat.position[1]) + ' Z: ' + Math.round(dat.position[2])
	div.appendChild(pos)

	var chunk = document.createElement('span') //ChunkID
	chunk.innerHTML = '<br>Chunk: 0|0|0'
	div.appendChild(chunk)

	var tool = document.createElement('span') //Selected item
	tool.innerHTML = '<br>Tool: Empty'
	div.appendChild(tool)

	var timer = 0

	noa.on('tick', function() {
		if (timer == 2) {
			timer = 0
			playertool = getTool(eid)
			pos.innerHTML = '<br>X: ' + Math.round(dat.position[0]) + ' Y: ' + Math.round(dat.position[1]) + ' Z: ' + Math.round(dat.position[2])
			if (playertool.id != undefined) tool.innerHTML = '<br>Tool: ' + getItemName(playertool.id) + ' [' + playertool.id + '] x' + playertool.count
			else tool.innerHTML = '<br>Tool: Empty'
			try {
				chunk.innerHTML = '<br>Chunk: ' + noa.world._getChunkByCoords(dat.position[0], dat.position[1], dat.position[2]).id
			} catch { chunk.innerHTML = '<br>Chunk: ???' }
		}
		else {
			timer++
		}
	})
}





function setupCross() { //More like point in a middle of screen
	var div = document.createElement('div')
	div.id = 'game_cross'
	var style = 'position:absolute; top:50%; left:50%; z-index:0;'
	style += 'transform: translate(-50% -50%); border-radius:50%; background-color: white;'
	style += 'filter: opacity(0.5);height:6px; width:6px; backdrop-filter: invert(1);'
	div.style = style
	document.body.appendChild(div)
}

function setupSkybox() { // The box in the sky
	var scene = noa.rendering.getScene()

	var skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size:1000.0}, scene)
	var skyboxMaterial = new BABYLON.StandardMaterial("skybox", scene)
	skyboxMaterial.backFaceCulling = false
	skyboxMaterial.disableLighting = true
	skyboxMaterial.luminance = 1
	skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/skybox", scene)
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skybox.material = skyboxMaterial

	noa.rendering.addMeshToScene(skybox, false)


	noa.on('beforeRender', function(){
		var eid = noa.playerEntity
		var pos = noa.entities.getPositionData(eid)['_renderPosition']
		skybox.setPositionWithLocalVector(new BABYLON.Vector3(pos[0], pos[1], pos[2]))

	});
}

export async function openInventory() { // Opens inventory
	var inventory = noa.ents.getState(1, 'inventory')
	var items = Object.entries(inventory.main)
	var inv = inventory.main
	inventory.bin = {}

	var screen = document.createElement('div') // Main screen (blocks integration with canvas)
	screen.id = 'game_screen'
	var style = 'position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index:1;'
	style += 'color:white; height:auto; width:auto; background-color: #00000055;'
	style += 'font-size:40px; text-align:center; padding:3px;'
	style += 'min-width:2em;'
	screen.style = style
	document.body.appendChild(screen)

	

	var invGui = document.createElement('table') // Inventory table
	invGui.id = 'game_inventory'
	var style = 'position:fixed; bottom:50%; left:50%; z-index:2;'
	style += 'color:white; height:auto; width:auto;'
	style += 'font-size:40px; padding:3px;'
	style += 'min-width:2em; transform: translate(-50%, 50%);'
	invGui.style = style
	screen.appendChild(invGui)
	var hotbar = {}
	var slot = 9

	var bin = document.createElement('th') // Bin slot
	bin.id = -1
	bin.classList.add('float-left')
	bin.classList.add('inventory_item_bin')
	bin.addEventListener( 'click', function(){ inventoryLeftClick( parseInt(-1) ); updateInventory() } )
	bin.addEventListener( 'contextmenu', function(){ inventoryRightClick( parseInt(-1) ); updateInventory(); return false } )
	bin.innerHTML = await renderItem(inventory.bin)

	invGui.appendChild(bin)

	var tempslot = document.createElement('div') // Item at cursor
	tempslot.id = 'tempslot'
	tempslot.classList.add('align-bottom')
	tempslot.classList.add('inventory_temp')
	tempslot.innerHTML = await renderItem(inventory.tempslot)

	screen.appendChild(tempslot)


	for (var x = 0; x < (items.length/9)-1; x++) { // Inventory slots (backpack)
		var row = document.createElement('tr')
		invGui.appendChild(row)
		for (var y = 0; y < 9; y++) {
			hotbar[slot] = document.createElement('th')
			hotbar[slot].id = slot
			hotbar[slot].addEventListener( 'click', function(){ inventoryLeftClick( parseInt(this.id) ); updateInventory() } )
			hotbar[slot].addEventListener( 'contextmenu', function(){ inventoryRightClick( parseInt(this.id) ); updateInventory(); return false  } )
			hotbar[slot].classList.add('inventory_item')
			hotbar[slot].innerHTML = await renderItem(inv[slot])
			row.appendChild(hotbar[slot])
			slot = slot + 1
		}
	}

	var row_hotbar = document.createElement('tr')
	invGui.appendChild(row_hotbar)
	
	for (var x = 0; x < 9; x++) { // Inventory slots (hotbar)
		hotbar[x] = document.createElement('th')
		hotbar[x].id = x
		hotbar[x].classList.add('inventory_item_hotbar')
		hotbar[x].addEventListener( 'click', function(){ inventoryLeftClick( parseInt(this.id) ); updateInventory() } )
		hotbar[x].addEventListener( 'contextmenu', function(){ inventoryRightClick( parseInt(this.id) ); updateInventory(); return false  } )
		hotbar[x].innerHTML = await renderItem(inv[x])
		row_hotbar.appendChild(hotbar[x])
	}

	window.addEventListener("mousemove", function(e){ //Moving items at cursor
		tempslot.style.left = e.x + 'px'
		tempslot.style.top = e.y + 'px'
	});

	async function updateInventory() { // Update slots
		for (var x = 0; x < items.length; x++) {
			hotbar[x].innerHTML = await renderItem(inv[x])
		}
		bin.innerHTML = await renderItem(inventory.bin)
		tempslot.innerHTML = await renderItem(inventory.tempslot)
	}

}


async function renderItem(item) { // Inventory item rendering
	if (item.id == undefined) return ''

	var count = ''
	if (item.count == Infinity) count = 'Inf'
	else if (item.count != 1) count = item.count

	if (game.items[item.id].type == 'block') {
		var block = game.blockIDs[item.id]
		var txt = game.blocks[block].textures

		try { 
			var txtLeft = txt[txt.length - 1]
			var txtRight = txt[txt.length - 1]
			var txtTop = txt[0]
		}
		catch { 
			var txtLeft = 'error'
			var txtRight = 'error' 
			var txtTop = 'error' 


		}
		
		var x = '<div class="item_icon">' +
					'<div class="cube">' +
						'<div class="cube_face cube_face-right" style="background-image: url(textures/' + txtRight +'.png"></div>' +
						'<div class="cube_face cube_face-left" style="background-image: url(textures/' + txtLeft +'.png"></div>' +
						'<div class="cube_face cube_face-top" style="background-image: url(textures/' + txtTop +'.png"></div>' +
					'</div>' + 
				'</div>' + 
				'<div class="item_count float-right">' + count + '</div>'
		return x
	} else {
		try { var txt = game.items[item.id].texture}
		catch { var txt = 'error' }
		return '<div class="item_icon" style="background-image: url(textures/' + txt +'.png"></div><div class="item_count float-right">' + count + '</div>'
	}
}

