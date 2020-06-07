import { getMusicVolume, setMusicVolume } from './audio'
import { getInventory, inventoryAdd, inventoryRemove, inventoryHasItem, inventorySwitch} from './player'
import { startBreakingBlock, stopBreakingBlock } from './block-break'
import { openInventory } from './gui'
import { sendFromInput } from '../gui/chat'
import { sendPacket } from '../protocol/main'


import '@babylonjs/core/Debug/debugLayer'
var MPS = require('mesh-particle-system');


/*
 * 
 *	  interactivity
 * 
*/


export function setupInteractions(noa) {
	// on left mouse, set targeted block to be air
	noa.inputs.down.on('fire', function () {
		if (noa.targetedBlock && !game.blocks[noa.targetedBlock.blockID].data.unbreakable) {
			startBreakingBlock(noa.targetedBlock.position, noa.targetedBlock.blockID)
		}
	})

	noa.inputs.up.on('fire', function () {
		stopBreakingBlock()
	})


	// place block on alt-fire (RMB/E)
	noa.inputs.down.on('alt-fire', function () {
		var pos = noa.targetedBlock.adjacent
		sendPacket('block-place', pos)
	})


	// pick block on middle fire (MMB/Q)
	noa.inputs.down.on('mid-fire', function () {
		if (noa.targetedBlock && noa.targetedBlock.blockID != 0) {
			var item = game.blocks[noa.targetedBlock.blockID].name
			var slot = inventoryHasItem(1, item, 1)
			var sel = getInventory(1).selected
			if (slot >= 0 && slot <= 8) getInventory(1).selected = slot
			else if (slot > -1) inventorySwitch(1, slot, sel)
		}
	})


	noa.inputs.down.on('muteMusic', function () {
		if (getMusicVolume() != 0) setMusicVolume(0)
		else setMusicVolume(0.15)
	})

	// 3rd person view
	noa.inputs.down.on('thirdprsn', function () {
		if (noa.camera.zoomDistance == 15) noa.camera.zoomDistance = 0
		else if (noa.camera.zoomDistance == 0) noa.camera.zoomDistance = 15
	})

	// Inventory
	noa.inputs.down.on('inventory', function () {	
		var inv = document.getElementById('game_screen')
		if (inv != undefined) {
			noa.container.canvas.requestPointerLock()
			document.body.removeChild(inv)
			noa.setPaused(false)
		}
		else {
			document.exitPointerLock()
			noa.setPaused(true)
			openInventory()

		}
	})


	// Command prompt
	noa.inputs.down.on('cmd', function() {
		sendFromInput()
	})

	noa.inputs.down.on('chat', function() {
		if (document.activeElement.tagName == 'BODY') document.getElementById('game_chatinput').focus()
		else document.getElementById('noa-canvas').focus()
		
	})

	setInterval(async function() {
		if (document.activeElement.tagName != 'BODY') { noa.setPaused(true) }
		else noa.setPaused(false)
	}, 100)

	// each tick, consume any scroll events and use them to zoom camera
	noa.on('tick', async function (dt) {

		var scroll = noa.inputs.state.scrolly
		if (scroll !== 0) {
			var pickedID = getInventory(1).selected
			var change = (scroll > 0) ? 1 : -1
			pickedID = pickedID + change
			if (pickedID >= game.hotbarsize) pickedID = 0
			else if (pickedID < 0) pickedID = game.hotbarsize-1
			getInventory(1).selected = pickedID
			sendPacket('selected', pickedID)
			

		}
	})


}

