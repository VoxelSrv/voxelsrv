module.exports = {
	init(seed, blocks) {initWorldGen(seed, blocks)},
	get(x, y, z) {return getBlock(x, y, z)},
	generate: generateChunk
}

var init = false
var blockIDs = {}
var heightNoise, caveNoise, biomeNoise1, biomeNoise2, biomeNoise3, seed, world, plantSeed

var chunkWitdh = 24
var chunkHeight = 120

function initWorldGen(newSeed, blocks) {
	init = true
	blockIDs = blocks
	seed = newSeed
	world = 'default'
}


function getBlock(x, y, z) {
	if (y == 40) return blockIDs.grass
	else if (35 < y < 40) return blockIDs.dirt
	else if (y <= 35) return blockIDs.stone
	else return 0
}


function generateChunk(id, chunk) {
	for (var x = 0; x < chunkWitdh; x++) {
		for (var z = 0; z < chunkWitdh; z++) {
			for (var y = 0; y < chunkHeight; y++) {
				var block = getBlock(x+id[0]*24, y, z+id[1]*24)
				if (block != 0) chunk.set(x, y, z, block)
			}
		}
	}
	return chunk

}
