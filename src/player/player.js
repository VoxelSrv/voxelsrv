import { Texture } from '@babylonjs/core/Materials/Textures'
import { WaterMaterial } from '@babylonjs/materials/water/waterMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'

import { getItemData, getItemMaxStack } from '../world/items'

export function setupPlayerEntity(noa) {
	var eid = noa.playerEntity
	var dat = noa.entities.getPositionData(eid)
	
	var w = dat.width
	var h = dat.height

	var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height

	var offset = [0, h / 2, 0]

	// Load and setup players model 

	BABYLON.SceneLoader.ImportMesh(["player"], "./models/", "player.gltf", scene, function (meshes, particleSystems, skeletons) {
    	var mainMesh = meshes[0] // Main mesh, needed to asign to entity
		
		var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height
		mainMesh.scaling = new BABYLON.Vector3(0.06, 0.06, 0.06);

		var offset = [0, 0, 0]

		// Asing mesh
		noa.entities.addComponent(eid, noa.entities.names.mesh, {
			mesh: mainMesh,
			offset: offset
		})

		
		// Add rest of meshes to scene
		var extras = meshes.slice(1)
		extras.forEach(function(mesh) {
			noa.rendering.addMeshToScene(mesh)
		})
		var anim = {}
		// Animations
		anim.idle = scene.getAnimationGroupByName('idle')
		anim.walk = scene.getAnimationGroupByName('walking')
		
		// Rendering
		noa.on('beforeRender', function() {

			extras.forEach(function(mesh) {
				mesh.visibility = noa.camera.zoomDistance/5
				mesh.rotation.y = noa.camera.heading //Breaks animations #TODO
			})
			if (noa.entities.getState(eid, 'movement').running) {
				anim.idle.stop()
				anim.walk.play(true)
				anim.walk
			} else {
				anim.idle.play(true)
				anim.walk.stop()
			}
		})
		console.log()
	})

	// Gamemode and players settings

	var move = noa.entities.getMovement(eid)

	move.jumpForce = 6
	move.jumpImpulse = 8.5
	move.maxSpeed = 7.5
	var invspace = {}
	for (var x = 0; x < 36; x++) {
		invspace[x] = {}
	}

	// Create inventory, move it to global entities js in future
	noa.ents.createComponent({
		name: 'inventory',
		state: {main: {}, selected: 0, tempslot:{}}
	})
	noa.ents.addComponent(eid, 'inventory', {main: invspace})

	// Gamemode settings

	if (game.mode == 0) {
		move.airJumps = 0

	} else {
		executeCommand('giveall')	
	}
}

// Adding items to inventory

export function inventoryAdd(eid, item, count, data) {
	if (game.items[item] == undefined) return false
	var inventory = noa.ents.getState(eid, 'inventory')
	var items = Object.entries(inventory.main)
	for (var [slot, data] of items) {
		if (data.id == item && (data.count+count) < getItemMaxStack(item)+1) {
			inventory.main[slot] = {id: item, count: count+data.count, data: data}
			return true
		}
	}
	for (var [slot, data] of items) {
		if (data.id == undefined) {
			inventory.main[slot] = {id: item, count: count, data: data}
			return true
		}
	}
	return false	
}

// Removing items from inventory

export function inventoryRemove(eid, item, count) {
	var inventory = noa.ents.getState(eid, 'inventory')
	var allItems = Object.entries(inventory.main)
	var sel = inventory.selected
	if (inventory.main[sel].id == item) {
		var newcount = inventory.main[sel].count-count
		count = count - inventory.main[sel].count
		if (newcount > 0) inventory.main[sel] = {id: item, count: newcount, data: inventory.main[sel].data}
		else inventory.main[sel] = {}
		if (count <= 0) return true
	}
	for (var [slot, data] of allItems) {
		if (count <= 0) return true
		if (data.id == item) {
			var newcount = data.count-count
			count = count - data.count
			if (newcount > 0) inventory.main[slot] = {id: item, count: newcount, data: data.data}
			else inventory.main[slot] = {}
		}
	}
	return true
}

// Sets slot to item

export function inventorySet(eid, slot, item, count, data) {
	var inventory = noa.ents.getState(eid, 'inventory')
	inventory.main[slot] = {id: item, count: count, data: data}
	return false
}
export function inventorySwitch(eid, x, y) {
	var inventory = noa.ents.getState(eid, 'inventory')
	var tempx = inventory.main[x]
	var tempy = inventory.main[y]
	inventory.main[x] = tempy
	inventory.main[y] = tempx
}

// Item movement on LeftClick in inventory

export function inventoryLeftClick(x) {
	var inventory = noa.ents.getState(1, 'inventory')
	if (x >= 0) { // Normal slots
		var tempY = {...inventory.tempslot}
		var tempX = {...inventory.main[x]}
		
		// If tempslot and target slot have the same itemtype
		if (tempY.id == tempX.id &&  tempY.id != undefined ) {
			if ((tempX.count + tempY.count) <= getItemMaxStack(tempX.id) ) {
				var tempZ = {...tempX}
				tempZ.count = tempX.count + tempY.count
				inventory.main[x] = tempZ
				inventory.tempslot = {}
			} else if ((tempX.count + tempY.count) > getItemMaxStack(tempX.id) ) { 
				var tempZ = {...tempX}
				var tempW = {...tempY}
				tempZ.count = getItemMaxStack(TempX.id)
				tempW.count = tempX.count + tempY.count - getItemMaxStack(tempX.id)
				inventory.main[x] = tempZ
				inventory.tempslot = tempW
			}
		}
		// If target slot has diffrent itemtype	
		else {
			inventory.main[x] = tempY
			inventory.tempslot = tempX
		}
	}
	else if (x == -1) { // Bin slot
		var tempy = {...inventory.tempslot}
		var tempx = {...inventory.bin}
		if (tempy.id == undefined) {
			inventory.bin = {}
			inventory.tempslot = tempx
		}
		else {
			inventory.bin = tempy
			inventory.tempslot = {}
		}
	}
}

// Inventory rightclick functionality

export function inventoryRightClick(x) {
	var inventory = noa.ents.getState(1, 'inventory')
	// Normal slots
	if (x >= 0) {
		var tempY = {...inventory.tempslot}
		var tempX = {...inventory.main[x]}
		if (tempY.id == undefined) { // Tempslot slot is empty
			var tempZ = {...tempX}
			var tempW = {...tempX}
			tempZ.count = Math.ceil(tempZ.count/2)
			tempW.count = Math.floor(tempW.count/2)
			if (tempW.count <= 0) tempW = {}
			inventory.main[x] = {...tempZ}
			inventory.tempslot = {...tempW}
		} else if (tempX.id == undefined) { // Target is empty
			var tempZ = {...tempY}
			var tempW = {...tempY}
			tempZ.count = 1
			tempW.count = tempW.count - 1
			if (tempW.count <= 0) tempW = {}
			inventory.main[x] = {...tempZ}
			inventory.tempslot = {...tempW}
		} else if (tempX.id == tempY.id && tempX.count+1 <= getItemMaxStack(tempX.id)) { // The same itemtype
			var tempZ = {...tempX}
			var tempW = {...tempY}
			tempZ.count = tempZ.count + 1
			tempW.count = tempW.count - 1
			if (tempW.count <= 0) tempW = {}
			inventory.main[x] = {...tempZ}
			inventory.tempslot = {...tempW}
		}
	}
	// Bin slot (ignored for now)
	else if (x == -1){

	}
}

// Checking if player has item

export function inventoryHasItem(eid, item, count) {
	var inventory = noa.ents.getState(eid, 'inventory')
	var items = Object.entries(inventory.main)

	for (var [slot, data] of items) {
		if (data.id == item && data.count >= count) return slot
	}
	return -1
}

// Getting inventory object

export function getInventory(eid) {
	var inventory = noa.ents.getState(eid, 'inventory')
	return inventory
}

export function getTool(eid) {
	var inventory = noa.ents.getState(eid, 'inventory')
	var sel = inventory.selected
	return inventory.main[sel]
}




