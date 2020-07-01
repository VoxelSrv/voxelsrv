


export function setupHand(noa) {
	var scene = noa.rendering.getScene()
	var eid = noa.playerEntity
	var hand = BABYLON.MeshBuilder.CreateBox("hand", {size:0.08, wrap: true}, scene)
	var handMaterial = new BABYLON.StandardMaterial("hand", scene)
	hand.material = handMaterial
	hand.parent = noa.rendering.getScene().activeCamera
	hand.rotation.y = -Math.PI/8
	noa.rendering.addMeshToScene(hand, false)
	hand.position = new BABYLON.Vector3(0.08, -0.08, 0.08)

	var animationBox = new BABYLON.Animation("movement", "position.z", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
		BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)

	var keys = [];
	keys.push({
		frame: 0,
		value: 0.08
	});

	keys.push({
		frame: 20,
		value: 0.085
	})

	keys.push({
		frame: 40,
		value: 0.08
	})

	keys.push({
		frame: 60,
		value: 0.075
	})

	keys.push({
		frame: 80,
		value: 0.08
	})

	animationBox.setKeys(keys)

	hand.animations.push(animationBox)
	scene.beginAnimation(hand, 0, 100, true)

	noa.on('tick', function() { //Updates Player's hand
		var inventory = noa.ents.getState(1, 'inventory')
		var inv =  inventory.main
		var sel = inventory.selected
		var url = new Array(3)
		var preUrl = new Array(3)

		if (items[inv[sel].id].type == 'block') {
			var block = blockIDs[inv[sel].id]
			try {
				var txt = blocks[block].texture
				preUrl[0] = txt[txt.length - 1]
				preUrl[1] = txt[txt.length - 1]
				preUrl[2] = txt[0]
			}
			catch { 
				preUrl[0] = 'error'
				preUrl[1] = 'error' 
				preUrl[2] = 'error'
			}
	
			for(var x = 0; x < 3; x++) {
				if ((preUrl[x].startsWith('http://') || preUrl[x].startsWith('https://')  ) && game.allowCustom == true ) url[x] = preUrl[x]
				else url[x] = 'textures/' + preUrl[x] + '.png'
			}

		} else {
			try { var txtRight = items[inv[sel].id].texture}
			catch { var txtRight = 'error' }
		}
		var mat = new BABYLON.Texture( url[1], scene, false, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
		handMaterial.ambientTexture = mat
	})
}