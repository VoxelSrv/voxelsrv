import { Texture } from '@babylonjs/core/Materials/Textures'
import { WaterMaterial } from '@babylonjs/materials/water/waterMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'

import { getItemData, getItemMaxStack } from '../world/items'

import { sendPacket } from '../protocol/main'

export function setupPlayerEntity(noa) {
	var eid = noa.playerEntity
	var dat = noa.entities.getPositionData(eid)
	
	var w = dat.width
	var h = dat.height

	var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height

	var offset = [0, h / 2, 0]

	// Load and setup players model 
	/*
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

			skeletons.forEach(function(bone) {
				bone.rotate(BABYLON.Axis.Y, noa.camera.heading, BABYLON.Space.WORLD, meshes)
			})

			extras.forEach(function(mesh) {
				mesh.visibility = noa.camera.zoomDistance/5
				mesh.rotation.y = noa.camera.heading
			})
			/*if (noa.entities.getState(eid, 'movement').running) {
				anim.idle.stop()
				anim.walk.play(true)
				anim.walk
			} else {
				anim.idle.play(true)
				anim.walk.stop()
			}
		})
	})
	*/
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
		//executeCommand('giveall')	
	}
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
	sendPacket('inventory-click', {type: 'left', slot: x})
}

// Inventory rightclick functionality

export function inventoryRightClick(x) {
	sendPacket('inventory-click', {type: 'right', slot: x})
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




