var ndarray = require('ndarray')

export function setChunk(id, chunk, noa) {
	console.log('Setting chunk '+  id)
	for (var yoff = 0; yoff < 5; yoff++) {
		var noaChunk = new ndarray( new Uint16Array(24 * 24 * 24), [24, 24, 24])
		var localID = id[0] + '|' + yoff + '|' + id[1] + '|default'
		for (var x = 0; x < 24; x++) {
			for (var z = 0; z < 24; z++) {
				for (var y = 0; y < 24; y++) {
					var block = chunk.get(x, (y + (yoff*24) ), z)
					noaChunk.set(x, y, z, block)
				}
			}
		}
		console.log(localID)
		noa.world.setChunkData(localID, noaChunk)
	}
}