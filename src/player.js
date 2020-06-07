import { sendFromInput } from "./gui/chat"

export function setupControls(noa, socket) {
	var eid = noa.playerEntity
	// on left mouse, set targeted block to be air
	noa.inputs.down.on('fire', function () {
		if (noa.targetedBlock) {
			//startBreakingBlock(noa.targetedBlock.position, noa.targetedBlock.blockID)
			socket.emit('block-break', noa.targetedBlock.position)
		}
	})

	noa.inputs.up.on('fire', function () {
		//stopBreakingBlock()
	})


	// place block on alt-fire (RMB/E)
	noa.inputs.down.on('alt-fire', function () {
		if (noa.targetedBlock != undefined) {
			var pos = noa.targetedBlock.adjacent
			socket.emit('block-place', pos)
		}
	})


	// pick block on middle fire (MMB/Q)
	noa.inputs.down.on('mid-fire', function () {
		if (noa.targetedBlock && noa.targetedBlock.blockID != 0) {
		}
	})

	// 3rd person view
	noa.inputs.down.on('thirdprsn', function () {
		if (noa.camera.zoomDistance == 15) noa.camera.zoomDistance = 0
		else if (noa.camera.zoomDistance == 0) noa.camera.zoomDistance = 15
	})

	// Inventory
	noa.inputs.down.on('inventory', function () {	
		var inv = document.getElementById('game_inventory_screen')
		if (inv.style.display == 'none') {
			console.log(inv.style.display)
			document.exitPointerLock()
			inv.style.display = 'initial'
			//noa.inputs.disabled = true
		}
		else {
			noa.container.canvas.requestPointerLock()
			inv.style.display = 'none'
			noa.inputs.disabled = false
		}
	})

	// Command prompt
	noa.inputs.down.on('cmd', function() {
		sendFromInput(socket)
	})

	noa.inputs.down.on('chat', function() {

		
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
			socket.emit('selected', pickedID)
			noa.ents.getState(noa.playerEntity, 'inventory').selected = pickedID
		}
	})

}


export function setupPlayer(noa) {
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

			skeletons.forEach(function(bone) {
				bone.rotate(BABYLON.Axis.Y, noa.camera.heading, BABYLON.Space.WORLD, meshes)
			})

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

	}
}