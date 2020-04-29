

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
		if (noa.targetedBlock && !game.unbreakableBlocks.includes(noa.targetedBlock.blockID)) {
			var block = noa.targetedBlock.blockID
			noa.setBlock(0, noa.targetedBlock.position)
			if (game.mode == 0) {
				inventory[block] = inventory[block] + 1
			}
		}
	})


	// place block on alt-fire (RMB/E)
	noa.inputs.down.on('alt-fire', function () {
		if (noa.targetedBlock && !game.illegalBlocks.includes(pickedID)) {
			if (inventory[pickedID]) {
				noa.addBlock(pickedID, noa.targetedBlock.adjacent)
				if (game.mode == 0) {
					inventory[pickedID] = inventory[pickedID] - 1
				}
			}
		}
	})


	// pick block on middle fire (MMB/Q)
	noa.inputs.down.on('mid-fire', function () {
		if (noa.targetedBlock && !game.illegalBlocks.includes(noa.targetedBlock.blockID)) pickedID = noa.targetedBlock.blockID
	})


	// pause (P)
	noa.inputs.bind('pause', 'P')
	noa.inputs.down.on('pause', function () {
		paused = !paused
		noa.setPaused(paused)
	})
	var paused = false


	// 3rd person view
	noa.inputs.bind('thirdprsn', 'M')
	noa.inputs.down.on('thirdprsn', function () {
		if (noa.camera.zoomDistance == 15) noa.camera.zoomDistance = 0
		else if (noa.camera.zoomDistance == 0) noa.camera.zoomDistance = 15
	})



	// each tick, consume any scroll events and use them to zoom camera
	noa.on('tick', function (dt) {
		var scroll = noa.inputs.state.scrolly
		if (scroll !== 0) {
			var change = (scroll > 0) ? 1 : -1
			pickedID = pickedID + change
			var maxnum = Object.keys(game.blocks).length
			if (pickedID > maxnum) pickedID = 1
			if (pickedID <= 0) pickedID = maxnum
			while (game.illegalBlocks.includes(pickedID)) {
				pickedID = pickedID + change
				if (pickedID > maxnum) pickedID = 1
			}
			

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

