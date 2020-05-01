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
	//var playerMesh = Mesh.CreateBox('player', 0.01, noa.rendering.getScene())

	var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height

	// offset of mesh relative to the entity's "position" (center of its feet)
	var offset = [0, h / 2, 0]

	// a "mesh" component to the player entity

	
	BABYLON.SceneLoader.ImportMesh(["player"], "./models/", "player.gltf", scene, function (meshes, particleSystems, skeletons) {
    	var mainMesh = meshes[0]
		var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height
		mainMesh.scaling = new BABYLON.Vector3(0.06, 0.06, 0.06);

		// offset of mesh relative to the entity's "position" (center of its feet)
		var offset = [0, 0, 0]

		noa.entities.addComponent(eid, noa.entities.names.mesh, {
			mesh: mainMesh,
			offset: offset
		})

		var extras = meshes.slice(1)
		extras.forEach(mesh => noa.rendering.addMeshToScene(mesh) )
		var anim = {}
		anim.idle = scene.getAnimationGroupByName('idle')
		anim.walk = scene.getAnimationGroupByName('walking')

		noa.on('beforeRender', function() {
			extras.forEach(function(mesh) {
				mesh.visibility = noa.camera.zoomDistance/5
				mesh.rotation.y = noa.camera.heading
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

	move.maxSpeed = 10
	move.jumpForce = 8
	var invspace = {}
	for (var x = 0; x < 27; x++) {
		invspace[x] = {}
	}
	noa.ents.createComponent({
		name: 'inventory',
		state: {main: {}, selected: 0}
	})
	noa.ents.addComponent(eid, 'inventory', {main: invspace})

	
	if (game.mode == 0) {
		move.airJumps = 0

	} else {
		executeCommand('giveall')	
	}
}

export function inventoryAdd(eid, item, count, data) {
	var inventory = noa.ents.getState(eid, 'inventory')
	var items = Object.entries(inventory.main)
	for (var [slot, data] of items) {
		if (data.id == item && (data.count+count) < game.itemdata[item].data.stack+1) {
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




