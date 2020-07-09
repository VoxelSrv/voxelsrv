module.exports = {
	init: initWorldGen,
	get: getBlock,
	generate: generateChunk
}

const { makeNoise2D, makeNoise3D } = require('open-simplex-noise')
const tree = require('./parts/tree')
const world = require('../world/main')
var hash = require('murmur-numbers')

var init = false
var blockIDs = {}
var heightNoise, caveNoise, biomeNoise1, biomeNoise2, biomeNoise3, seed, plantSeed

var biomeSpacing = 100 // Size of biomes

var chunkWitdh = 24
var chunkHeight = 120

var waterLevel = 40

function initWorldGen(newSeed, blocks) {
	init = true
	blockIDs = blocks
	seed = newSeed
	heightNoise = makeNoise2D(Math.round(seed * Math.sin(seed^1) * 10000))
	caveNoise = makeNoise3D(Math.round(seed * Math.sin(seed^2) * 10000))
	biomeNoise1 = makeNoise2D(Math.round(seed * Math.sin(seed^3) * 10000))
	biomeNoise2 = makeNoise2D(Math.round(seed * Math.sin(seed^4) * 10000))
	biomeNoise3 = makeNoise2D(Math.round(seed * Math.sin(seed^5) * 10000))
	plantSeed = Math.round(seed * Math.sin(seed^6) * 10000) 
}


function getBlock(x, y, z) {
	var m = biomeNoise2((x)/180, (z)/180)
	var r = getHeightMap(x, y, z, m)
	if (y <= r) return blockIDs.stone
	else if (y <= waterLevel) return blockIDs.water
	else return 0

	function getHeightMap(x, y, z, mountaines) {
		var dim = (caveNoise(x/180, y/180, z/180)+0.3)*140
		var dim2 = (caveNoise(x/20, y/20, z/20))*50
		var layer1 = heightNoise(x/140, z/140)*mountaines*20
		var layer2 = heightNoise(x/40, z/40)*20
		
		return Math.floor((dim*30+dim2*20+layer1*20+layer2*10-3)/65) + 30
	}
}

function getBiome(x, z, temperature, biomerng) {
	if (0.2 < temperature && biomerng == 1) return 'desert'
	else if ( -1 < temperature < -0.2 && biomerng == 1) return 'iceland'
	else if ( -0.3 < temperature < 0.3 && biomerng == 2) return 'forest'
	else return 'plants'
}

function generateChunk(id, chunk) {
	var xoff = id[0]*24
	var zoff = id[1]*24

	for (var x = 0; x < chunkWitdh; x++) {
		for (var z = 0; z < chunkWitdh; z++) {
			for (var y = 0; y < chunkHeight; y++) {
				var block = getBlock(x+xoff, y, z+zoff)
				var biome = 'plants'
				if (block != 0) {
					if (0 < y < 50 && getBlock(x+xoff, y, z+zoff) == 1 && getBlock(x+xoff, y+1, z+zoff) == 0 ) {
						if (biome == 'plants' || biome == 'forest') chunk.set(x, y, z, blockIDs.grass)
						else if (biome == 'iceland') chunk.set(x, y, z, blockIDs.grass_snow)
						else if (biome == 'desert') chunk.set(x, y, z, blockIDs.sand)
					}
					else if (getBlock(x+xoff, y+1, z+zoff) != 0 && getBlock(x+xoff, y, z+zoff) != blockIDs.water && getBlock(x+xoff, y+3, z+zoff) == 0) {
						if (biome == 'plants' || biome == 'forest' || biome == 'iceland') chunk.set(x, y, z, blockIDs.dirt)
						else if (biome == 'desert') chunk.set(x, y, z, blockIDs.sand)
					}
					else if (getBlock(x+xoff, y+1, z+zoff) == blockIDs.water && getBlock(x+xoff, y, z+zoff) != 0 && getBlock(x+xoff, y, z+zoff) != blockIDs.water) {
						chunk.set(x, y, z, blockIDs.gravel)
					}
					else chunk.set(x, y, z, block)
				}
			}
		}
	}

	
	for (var x = 0; x < chunk.shape[0]; x++) {
		for (var z = 0; z < chunk.shape[2]; z++) {
			if ( hash( (x+xoff), (z+zoff), plantSeed) < 0.1 ) {
				var high = {...world.getHighestBlock(chunk, x, z)}
				if (high.block == blockIDs.grass) {
					chunk.set(x, high.level+1, z, blockIDs.grass_plant)
				}
			}
			else if ( hash( (x+xoff), (z+zoff), plantSeed*2) < 0.1 ) {
				var high = {...world.getHighestBlock(chunk, x, z)}
				if (high.block == blockIDs.grass) {
					chunk.set(x, high.level+1, z, ( ( hash( x+xoff, y, z+zoff, plantSeed) <= 0.5 ) ? blockIDs.red_flower : blockIDs.yellow_flower ) )
				}
			}
			else if ( 5 < x && x < 17 && 5 < z && z < 17) { //Temp
				if ( hash( (x+xoff), (z+zoff), seed) < 0.02 ) {
					var high = {...world.getHighestBlock(chunk, x, z)}
					if (high.block == blockIDs.grass) {
						var gen = tree.oakTree( hash( (x+xoff), (z+zoff), seed)*1000 )
						pasteStructure(chunk, gen, x, high.level + 1, z)
					}
				} else if ( hash( (x+xoff), (z+zoff), seed*5) < 0.007 ) {
					var high = {...world.getHighestBlock(chunk, x, z)}
					if (high.block == blockIDs.grass) {
						var gen = tree.birchTree( hash( (x+xoff), (z+zoff), seed)*5834 )
						pasteStructure(chunk, gen, x, high.level + 1, z)
					}
				}
			}
		}
	}

	
	return chunk

}


function pasteStructure(chunk, gen, x, y, z) {
	var xm = Math.round(gen.shape[0]/2)
	var zm = Math.round(gen.shape[2]/2)

	for (var i = 0; i < gen.shape[0]; i++) {
		for (var j = 0; j < gen.shape[1]; j++) {
			for (var k = 0; k < gen.shape[2]; k++) {
				if (gen.get(i, j, k) != 0) { 
					chunk.set(x-xm+i, y+j, z-zm+k, gen.get(i, j, k) ) 
				}
			}
		}
	}
}