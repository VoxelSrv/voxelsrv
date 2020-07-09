var hash = require('murmur-numbers')
var ndarray = require('ndarray')
var blockIDs = require('../../blocks').getIDs()

function generateOakTree(seed) {
	var gen = new ndarray( new Uint16Array(16 * 16 * 16), [16, 16, 16])

	var size = Math.round( hash(seed*5) )

	var height = 4 + Math.round( hash(seed) ) + size*2

	for (var y = 0; y < height; y++) {
		gen.set(8, y, 8, blockIDs.log)
	}

	for (var x = -4 ; x <= 4; x++) {
		for (var y = -4; y <= 5; y++) {
			for (var z = -4; z <= 4; z++) {
				if (gen.get(x+8, y+height, z+8) == 0 && hash(x, y, z, seed*2) > 0.3 && dist(x, y, z) <= 3 + size) gen.set(x+8, y+height, z+8, blockIDs.leaves)
			}
		}
	}

	return gen
}

function generateBirchTree(seed) {
	var gen = new ndarray( new Uint16Array(16 * 16 * 16), [16, 16, 16])

	var size = Math.round( hash(seed*3) )

	var height = 5 + Math.round( hash(seed) ) + size*2

	for (var y = 0; y < height; y++) {
		gen.set(8, y, 8, blockIDs.birch_log)
	}

	for (var x = -5 ; x <= 5; x++) {
		for (var y = -5; y <= 5; y++) {
			for (var z = -5; z <= 5; z++) {
				if (gen.get(x+8, y+height, z+8) == 0 && hash(x, y, z, seed*2) > 0.3 && dist(x, y, z) <= 4 + size - Math.round( hash(x, y, z, seed*7) )) gen.set(x+8, y+height, z+8, blockIDs.birch_leaves)
			}
		}
	}

	return gen
}




function dist(x, y, z) {
	return Math.sqrt(x*x + y*y + z*z)
}

module.exports = {
	oakTree: generateOakTree,
	birchTree: generateBirchTree
}