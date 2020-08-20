

export function setupGamepad(noa) {
	var gamepad = null

	var block = {}

	noa.on('beforeRender', function() {
		if (navigator.getGamepads()[0] != null) gamepad = navigator.getGamepads()[0]
		else gamepad = null

		if (gamepad != null) { 
			applyMove(gamepad.axes[0], gamepad.axes[1], gamepad.axes[2], gamepad.axes[3])
			noa.inputs.state.jump = gamepad.buttons[0].pressed
			if (gamepad.buttons[13].pressed) noa.inputs.down.emit('mid-fire')

			if (gamepad.buttons[2].pressed && block.inventory != true ) { 
				noa.inputs.down.emit('inventory')
				block.inventory = true
				setTimeout(function() { block.inventory = false}, 200)
			}

			if (gamepad.buttons[6].pressed && block.altfire != true) { 
				noa.inputs.down.emit('alt-fire')
				block.altfire = true
				setTimeout(function() { block.altfire = false}, 200)


			}

			if (gamepad.buttons[7].pressed && block.fire != true) { 
				noa.inputs.down.emit('fire') 
				block.fire = true
				setTimeout(function() { block.fire = false }, 200)

			}

		}
	})

	setInterval(function() {
		if (gamepad != null) { 
			if (gamepad.buttons[4].pressed) noa.inputs.state.scrolly = -1
			else if (gamepad.buttons[5].pressed) noa.inputs.state.scrolly = 1
			else noa.inputs.state.scrolly = 0
		}
	}, 140)

	


	function applyMove(x1, y1, x2, y2) {
		x1 = Math.round(x1)
		y1 = Math.round(y1)

		if (y1 == 0) { 
			noa.inputs.state.forward = false
			noa.inputs.state.backward = false
		} else if (y1 > 0) { 
			noa.inputs.state.forward = false
			noa.inputs.state.backward = true
		} else if (y1 < 0) { 
			noa.inputs.state.forward = true
			noa.inputs.state.backward = false
		}
		if (x1 == 0) { 
			noa.inputs.state.left = false
			noa.inputs.state.right = false
		} else if (x1 > 0) { 
			noa.inputs.state.left = false
			noa.inputs.state.right = true
		} else if (x1 < 0) { 
			noa.inputs.state.left = true
			noa.inputs.state.right = false
		} 


		noa.camera.heading = noa.camera.heading + Math.trunc(x2*10)/500
		noa.camera.pitch = noa.camera.pitch + Math.trunc(y2*10)/500

	}

}
