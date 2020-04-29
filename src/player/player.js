import { Texture } from '@babylonjs/core/Materials/Textures'
import { WaterMaterial } from '@babylonjs/materials/water/waterMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'

export function setupPlayerEntity(noa) {
	// get the player entity's ID and other info (aabb, size)
	var eid = noa.playerEntity
	var dat = noa.entities.getPositionData(eid)
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

	if (game.mode == 0) {
		noa.entities._storage.movement.hash[eid].airJumps = 0
		for (var id = 1; id <= Object.keys(game.blocks).length; id++) {
			global.inventory[id] = 0
		}
	} else {
		for (var id = 1; id <= Object.keys(game.blocks).length; id++) {
			global.inventory[id] = Infinity
		}
	}
	noa.entities._storage.movement.hash[eid].maxSpeed = 10



	// make a Babylon.js mesh and scale it, etc.
	var hand = Mesh.CreateBox('hand', 2, noa.rendering.getScene())

	var axis = BABYLON.Vector3(0, 1, 0)
	noa.on('tick', function(){noa.camera.getCameraRotation
		playerMesh.rotation.y = noa.camera.heading
		if (inventory[pickedID] < 0 || inventory[pickedID] == undefined) inventory[pickedID] = 99
	});

	
}
