


export function setupHand(noa) {
	var scene = noa.rendering.getScene()
	var eid = noa.playerEntity
	var hand = BABYLON.MeshBuilder.CreateBox("hand", {size:0.08}, scene)
	var handMaterial = new BABYLON.StandardMaterial("hand", scene)
	hand.material = handMaterial
	hand.parent = noa.rendering.getScene().activeCamera
	hand.rotation.y = -Math.PI/8
	noa.rendering.addMeshToScene(hand, false)
	hand.position = new BABYLON.Vector3(0.08, -0.08, 0.08)

	noa.on('tick', function() { //Updates Player's hand
		var inventory = noa.ents.getState(1, 'inventory')
		var inv =  inventory.main
		var sel = inventory.selected

		if (items[inv[sel].id].type == 'block') {
			var block = blockIDs[inv[sel].id]
			try {
				var txt = blocks[block].texture
	
				try { 
					var txtLeft = txt[txt.length - 1]
					var txtRight = txt[txt.length - 1]
					var txtTop = txt[0]
				} catch { 
					var txtLeft = 'error'
					var txtRight = 'error' 
					var txtTop = 'error' 
				}
			}
			catch { 
				var txtLeft = 'error'
				var txtRight = 'error' 
				var txtTop = 'error' 
			}
		} else {
			try { var txtRight = items[inv[sel].id].texture}
			catch { var txtRight = 'error' }
		}
		var mat = new BABYLON.Texture( 'textures/' + txtRight + '.png', scene, false, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
		handMaterial.ambientTexture = mat
	})
}