import { Texture } from '@babylonjs/core/Materials/Textures'
import { WaterMaterial } from '@babylonjs/materials/water/waterMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'

export function setupPlayerEntity(noa) {
	// get the player entity's ID and other info (aabb, size)
	var eid = noa.playerEntity
	var dat = noa.entities.getPositionData(eid)

	// Setting player's model
	
	var w = dat.width
	var h = dat.height

	// make a Babylon.js mesh and scale it, etc.
	var playerMesh = Mesh.CreateBox('player', 1, noa.rendering.getScene())
	playerMesh.scaling.x = playerMesh.scaling.z = w
	playerMesh.scaling.y = h
	var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height

	// offset of mesh relative to the entity's "position" (center of its feet)
	var offset = [0, h / 2, 0]

	// a "mesh" component to the player entity
	noa.entities.addComponent(eid, noa.entities.names.mesh, {
		mesh: playerMesh,
		offset: offset
	})

	// Gamemode and players settings

	var move = noa.entities.getMovement(eid)

	if (game.mode == 0) {
		move.airJumps = 0

	} else {

	}

	move.maxSpeed = 10
	move.jumpForce = 8
	var invspace = {}
	for (var x = 0; x < 18; x++) {
		invspace[x] = {}
	}

	noa.ents.createComponent({
		name: 'inventory',
		state: {main: {}, selected: 0}
	})
	noa.ents.addComponent(eid, 'inventory', {main: invspace})

	var inventory = noa.ents.getState(eid, 'inventory')

}

export function inventoryAdd(eid, item, count, data) {
	var inventory = noa.ents.getState(eid, 'inventory')
	var items = Object.entries(inventory.main)
	for (var [slot, data] of items) {
		if (data.id == item && (data.count+count) < 100) {
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

export function inventoryRemove(eid, item, count) {
	var inventory = noa.ents.getState(eid, 'inventory')
	var items = Object.entries(inventory.main)
	for (var [slot, data] of items) {
		if (data.id == item) {
			var newcount = data.count-count
			if (newcount > 0) inventory.main[slot] = {id: item, count: newcount, data: data.data}
			else inventory.main[slot] = {}
			return true
		}
	}
	return false
}

export function inventorySet(eid, slot, item, count, data) {
	var inventory = noa.ents.getState(eid, 'inventory')
	inventory.main[slot] = {id: item, count: count, data: data}
	return false
}

export function inventoryHasItem(eid, slot, item, count, data) {
	var inventory = noa.ents.getState(eid, 'inventory')
	inventory.main[slot] = {id: item, count: count, data: data}
	return false
}

export function getInventory(eid) {
	var inventory = noa.ents.getState(eid, 'inventory')
	return inventory
}




