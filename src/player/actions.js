import { getMusicVolume, setMusicVolume } from './audio'
import { getInventory, inventoryAdd, inventoryRemove } from './player'
import { openCommandPrompt } from '../world/commands'
import { openInventory } from './gui'


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
		if (noa.targetedBlock && !game.blockdata[noa.targetedBlock.blockID].data.unbreakable) {
			var block = noa.targetedBlock.blockID
			var item = game.blockdata[block].data.drop
			noa.setBlock(0, noa.targetedBlock.position)
			inventoryAdd(1, item, 1, {})
		}
	})


	// place block on alt-fire (RMB/E)
	noa.inputs.down.on('alt-fire', function () {
		var inv = getInventory(1)
		var item = inv.main[inv.selected].id
		if (item != undefined && game.itemdata[item].type == 0) {
			var block = game.blocks[item]
			if (noa.targetedBlock && block != undefined && !game.blockdata[block].data.illegal) {
				var pos = noa.targetedBlock.adjacent
				var x = noa.addBlock(block, pos)
				if (x == block) inventoryRemove(1, item, 1)
			}
		}
	})


	// pick block on middle fire (MMB/Q)
	noa.inputs.down.on('mid-fire', function () {
		//if (noa.targetedBlock && !game.blockdata[noa.targetedBlock.blockID].data.illegal) pickedID = noa.targetedBlock.blockID
	})


	// pause (P)
	noa.inputs.bind('pause', 'P')
	noa.inputs.down.on('pause', function () {
		paused = !paused
		noa.setPaused(paused)
	})
	var paused = false

	noa.inputs.bind('muteMusic', 'O')
	noa.inputs.down.on('muteMusic', function () {
		if (getMusicVolume() != 0) setMusicVolume(0)
		else setMusicVolume(0.15)
	})

	// 3rd person view
	noa.inputs.bind('thirdprsn', 'M')
	noa.inputs.down.on('thirdprsn', function () {
		if (noa.camera.zoomDistance == 15) noa.camera.zoomDistance = 0
		else if (noa.camera.zoomDistance == 0) noa.camera.zoomDistance = 15
	})

	// Inventory
	noa.inputs.bind('inventory', 'I')
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
	noa.inputs.bind('cmd', 'T')
	noa.inputs.down.on('cmd', function () {
		openCommandPrompt()
	})



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
			

		}
	})


	// launch Babylon debug layer when pressing "Z"
	var debug = false
	var scene = noa.rendering.getScene()
	noa.inputs.bind('debug', 'Z')
	noa.inputs.down.on('debug', () => {
		// inspector is very heavy, so load it via dynamic import
		import('@babylonjs/inspector').then(data => {
			debug = !debug
			if (debug) scene.debugLayer.show()
			else scene.debugLayer.hide()
		})
	})


}

