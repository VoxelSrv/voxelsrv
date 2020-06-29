
export function setupInfo(noa, server, dataLogin) {
	var eid = noa.playerEntity
	var dat = noa.entities.getPositionData(eid)

	var div = document.createElement('div') // Main div
	div.id = 'game_version'
	var style = 'position:absolute; top:5; left:5; z-index:0;'
	style += 'color:white; text-shadow: 1px 1px black;'
	style += 'font-size:20px; margin:4px;'
	div.style = style
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
	var style = 'position:absolute; top:50%; left:50%; z-index:0;'
	style += 'transform: translate(-50% -50%); border-radius:50%; background-color: white;'
	style += 'filter: opacity(0.5);height:6px; width:6px; backdrop-filter: invert(1);'
	div.style = style
	document.body.appendChild(div)
}