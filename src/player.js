import { setupGamepad } from "./gamepad"
import { sendFromInput } from "./gui/chat"
import { isMobile } from 'mobile-device-detect'

const protocol = require('./protocol')

var noa

const screenshot = require("canvas-screenshot")


export function setupControls(noa, send) {
	var eid = noa.playerEntity

	noa.blockTargetIdCheck = function(id) {

		if (blockIDmap[ id ] != undefined) {
			if (blocks[ blockIDmap[ id ] ].options.fluid == true) return false
			return true
		}
		else return false
	}

	noa.inputs.preventDefaults = true

	// on left mouse, set targeted block to be air
	noa.inputs.down.on('fire', function () {
		if (noa.targetedBlock) {
			//startBreakingBlock(noa.targetedBlock.position, noa.targetedBlock.blockID)
			var pos = noa.targetedBlock.position
			send('actionBlockBreak', {x: pos[0], y: pos[1], z: pos[2] } )
		}
	})

	noa.inputs.up.on('fire', function () {
		//stopBreakingBlock()
	})


	// place block on alt-fire (RMB/E)
	noa.inputs.down.on('alt-fire', function () {
		if (noa.targetedBlock != undefined) {
			var pos = noa.targetedBlock.adjacent
			var pos2 = noa.targetedBlock.position
			if (noa.ents.isTerrainBlocked(pos[0], pos[1], pos[2]) == false) { 
				send('actionBlockPlace', {x: pos[0], y: pos[1], z: pos[2], x2: pos2[0], y2: pos2[1], z2: pos2[2]} ) 
			}
		}
	})


	// pick block on middle fire (MMB/Q)
	noa.inputs.down.on('mid-fire', function () {
		if (noa.targetedBlock && noa.targetedBlock.blockID != 0) {
			var item = blocks[noa.targetedBlock.blockID].name
			var slot = inventoryHasItem(noa.playerEntity, item, 1)
			var sel = noa.ents.getState(eid, 'inventory').selected
			if (slot != -1 && slot < 9) {
				send('actionInventoryClick', { type: 'select', slot: slot })
				noa.ents.getState(eid, 'inventory').selected = slot
			}
			else if (slot != -1) send('actionInventoryClick', { type: 'switch', slot: slot, slot2: sel })
		}
	})

	// 3rd person view
	noa.inputs.down.on('thirdprsn', function () {
		if (document.pointerLockElement == noa.container.canvas) {

		//if (noa.camera.zoomDistance == 15) noa.camera.zoomDistance = 0
		//else if (noa.camera.zoomDistance == 0) noa.camera.zoomDistance = 15
		}
	})

	// Inventory
	noa.inputs.down.on('inventory', function () {	
		var inv = document.getElementById('game_inventory_screen')
		var input = document.getElementById('game_chatinput')

		if (input.style.display != 'none') {}
		else if (inv.style.display == 'none') {
			document.exitPointerLock()
			inv.style.display = 'initial'
		}
		else {
			noa.container.canvas.requestPointerLock()
			inv.style.display = 'none'
		}
	})

	noa.inputs.down.on('chat', function() {
		var input = document.getElementById('game_chatinput')
		if (input.style.display == 'none') {
			document.exitPointerLock()
			noa.inputs.preventDefaults = false
			input.style.display = 'initial'
			input.focus()
			setInterval( function() {
				if (document.activeElement.id != 'game_chatinput') {
					input.style.display = 'none'
					noa.inputs.preventDefaults = true
					return
				} 
			}, 500)
		}	
	})

	var pause = false
	noa.inputs.down.on('menu', (e) => {
		console.log(e)

		var inv = document.getElementById('game_inventory_screen')
		var input = document.getElementById('game_chatinput')
		var menu = document.getElementById('menu_pause')


		if (input.style.display != 'none') {
			noa.container.canvas.requestPointerLock()
			input.style.display = 'none'
			return
		} else if (inv.style.display != 'none') {
			noa.container.canvas.requestPointerLock()
			inv.style.display = 'none'
			return
		} else if (menu.style.display != 'none') {
			noa.container.canvas.requestPointerLock()
			menu.style.display = 'none'
			return
		} else{
			menu.style.display = 'initial'
			return
		}
	})

	document.addEventListener('pointerlockchange', function() {
		if (document.pointerLockElement == noa.container.canvas) {
			var menu = document.getElementById('menu_pause')
			menu.style.display = 'none'
		}
	}, false)


	noa.inputs.down.on('chatenter', function() {
		var input = document.getElementById('game_chatinput')
		if (input.style.display != 'none') { 
			sendFromInput(send)
			noa.container.canvas.requestPointerLock()
			input.style.display = 'none'
			noa.setPaused(false)
		}
	})

	noa.inputs.down.on('tab', function () {
		document.getElementById('game_tab').style.display = 'initial'
	})

	noa.inputs.up.on('tab', function () {
		document.getElementById('game_tab').style.display = 'none'
	})

	noa.inputs.up.on('screenshot', function () {
		if (document.pointerLockElement == noa.container.canvas) {
			screenshot(noa.container.canvas, {filename: 'VoxelSRV-' + Date.now() + '.png'})
		}
	})

	// each tick, consume any scroll events and use them to zoom camera
	noa.on('tick', async function () {
		var scroll = noa.inputs.state.scrolly
		if (scroll !== 0) {
			var pickedID = noa.ents.getState(eid, 'inventory').selected
			var change = (scroll > 0) ? 1 : -1
			pickedID = pickedID + change
			if (pickedID >= game.hotbarsize) pickedID = 0
			else if (pickedID < 0) pickedID = 8
			send('actionInventoryClick', {slot: pickedID, type: 'select'} )
			noa.ents.getState(noa.playerEntity, 'inventory').selected = pickedID
		}

	})

	noa.inputs.bind('numberkey', '1', '2', '3', '4', '5', '6', '7', '8', '9')
	noa.inputs.down.on('numberkey', (e) => {
		if (document.pointerLockElement == noa.container.canvas) {
			var num = parseInt(e.key)
			var pickedID = noa.ents.getState(eid, 'inventory').selected
			pickedID = num - 1 
			send('actionInventoryClick', {slot: pickedID, type: 'select'} )
			noa.ents.getState(noa.playerEntity, 'inventory').selected = pickedID
		}
	})

	// Tempfix
	
	noa.on('beforeRender', async () => {
		if (document.pointerLockElement != noa.container.canvas && !isMobile) {
			noa.inputs.state.left = false
			noa.inputs.state.right = false
			noa.inputs.state.forward = false
			noa.inputs.state.backward = false
			noa.inputs.state.jump = false
		}
	})




	if (localStorage.getItem('gamepad') == 'true') setupGamepad(noa)

}


export function setupPlayer(noa2, invData) {
	noa = noa2

	var eid = noa.playerEntity
	var dat = noa.entities.getPositionData(eid)
	
	var w = dat.width
	var h = dat.height

	var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height

	var offset = [0, h / 2, 0]

	noa.rendering.getScene().cameras[0].fov = 1
	
	// Gamemode and players settings

	var move = noa.entities.getMovement(eid)

	move.jumpForce = 6
	move.jumpImpulse = 8.5
	move.maxSpeed = 7.5


	// Create inventory, move it to global entities js in future
	noa.ents.createComponent({
		name: 'inventory',
		state: {main: {}, selected: 0, tempslot:{}}
	})
	if (invData != undefined) noa.ents.addComponent(eid, 'inventory', invData)
	else {
		var invspace = {}
		for (var x = 0; x < 36; x++) {
			invspace[x] = {}
		}
		noa.ents.addComponent(eid, 'inventory', {main: invspace})

	}

	// Gamemode settings

	if (game.mode == 0) {
		move.airJumps = 0

	}

	noa.entities.addComponent(eid, noa.entities.names.mesh, {
		mesh: new BABYLON.Mesh('main', scene),
		offset: offset
	})
}



function inventoryHasItem(eid, item, count) {
	var inventory = noa.ents.getState(eid, 'inventory')
	var items = Object.entries(inventory.main)

	for (var [slot, data] of items) {
		if (data.id == item && data.count >= count) return parseInt(slot)
	}
	return -1
}