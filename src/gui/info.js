
export function setupInfo(noa, server, dataLogin) {
	var eid = noa.playerEntity
	var dat = noa.entities.getPositionData(eid)

	var div = document.createElement('div') // Main div
	div.id = 'game_version'
	document.body.appendChild(div)

	var version = document.createElement('span') // Version
	version.innerHTML = game.name + ' ' + game.version +'<br>Noa: ' + noa.version
	div.appendChild(version)

	var world = document.createElement('span') //World
	world.innerHTML = '<br>Server: ' + dataLogin.name + ' [' + server + ']'
	div.appendChild(world)

	var pos = document.createElement('span') //Coordinates
	pos.innerHTML = '<br>X: ' + Math.round(dat.position[0]) + ' Y: ' + Math.round(dat.position[1]) + ' Z: ' + Math.round(dat.position[2])
	div.appendChild(pos)

	var chunk = document.createElement('span') //ChunkID
	chunk.innerHTML = '<br>Chunk: 0|0|0'
	div.appendChild(chunk)

	var timer = 0

	noa.on('tick', function() {
		if (timer == 2) {
			timer = 0
			pos.innerHTML = '<br>X: ' + Math.round(dat.position[0]) + ' Y: ' + Math.round(dat.position[1]) + ' Z: ' + Math.round(dat.position[2])
			try {
				chunk.innerHTML = '<br>Chunk: ' + noa.world._getChunkByCoords(dat.position[0], dat.position[1], dat.position[2]).id
			} catch { chunk.innerHTML = '<br>Chunk: ???' }
		}
		else {
			timer++
		}
	})
}

export function setupCross() { //More like point in a middle of screen
	var div = document.createElement('div')
	div.id = 'game_cross'
	document.body.appendChild(div)
}