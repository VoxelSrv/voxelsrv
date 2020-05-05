
import { makeNoise2D, makeNoise3D, makeNoise4D } from 'open-simplex-noise'


var hash = require('murmur-numbers')

var ndarray = require('ndarray')

var cruncher = require('voxel-crunch')
var storage = {}

// plumbing


function chunkIsStored(id) {
	if (storage[id]) var x = true
	else var x = false
	
	return x
}


function saveChunk(id, arr, state, biometable) {
	if (storage[id] == undefined) storage[id] = {}
	storage[id].chunk = cruncher.encode(arr.data)
	if (state) {
		storage[id].state = state
	}
	if (biometable) {
		storage[id].biometable = biometable
	}
}


function retrieveChunk(id, arr) {
	cruncher.decode(storage[id].chunk, arr.data)
	var state = storage[id].state
	return state
}


var worldgen = new WorldGen()
self.onmessage = function (ev) { worldgen.onMessage(ev) }

function WorldGen() {
	var blockIDs = {}
	var heightNoise
	var caveNoise
	var caveNoise2
	var biomeNoise1
	var biomeNoise2
	var biomeNoise3
	var seed
	var world
	var chunksize = 24
	this.onMessage = function (ev){
		var msg = ev && ev.data && ev.data.msg
		if (!msg) return

		if (msg=='init') {
			blockIDs = ev.data.blocks
			seed = ev.data.seed
			world = ev.data.world
			chunksize = ev.data.chunksize
			heightNoise = makeNoise2D(seed)
			caveNoise = makeNoise3D(seed)
			caveNoise2 = makeNoise3D(seed*2)
			biomeNoise1 = makeNoise2D(seed*100/17)
			biomeNoise2 = makeNoise2D(seed*100/71)
			biomeNoise3 = makeNoise2D(seed*100/942)
		}

		if (msg=='savechunk') {
			var d = ev.data
			var array = new ndarray( d.data, d.shape )
			saveChunk(d.id, array, 'generated')
		}

		if (msg=='generate') {
			var d = ev.data
			var array = new ndarray( d.data, d.shape )
			getChunk(d.id, array, d.x, d.y, d.z, 'generated')

			// when done, return the ndarray to main thread
			updateChunk(d.id, array)
		}
	}
	function updateChunk(id, array) {
		self.postMessage({
			msg: 'generated',
			data: array.data,
			shape: array.shape,
			id: id
		})
	}

	function forceRemoveChunk(id) {
		self.postMessage({
			msg: 'remove',
			id: id
		})
	}

	function getChunk(id, chunk, x, y, z, state) {
		if (chunkIsStored(id)) { var result = retrieveChunk(id, chunk) }
		if (chunkIsStored(id) && result == 'populate') populateChunk(chunk, x, y, z, id)
		else if (chunkIsStored(id) && result == state) {}
		else {
			var biometable = ndarray(new Array, [chunksize, chunksize])
			generateChunk(chunk, x, y, z, id, biometable)
			populateChunk(chunk, x, y, z, id, biometable)
		}
	}

	function sendDebug(debug) {
		self.postMessage({
			msg: 'debug',
			data: debug
		})
	}

	// two versions of world data
	// `data` is an ndarray - see https://github.com/scijs/ndarray
	var biomeSpacing = 200
	async function generateChunk(chunk, x, y, z, id, biometable) {
		var dx = chunk.shape[0]
		var dy = chunk.shape[1]
		var dz = chunk.shape[2]
		
		for (var i = 0; i < dx; i++) {
			for (var k = 0; k < dz; k++) {
				var temperature = biomeNoise1((x + i)/(biomeSpacing*2), (z + k)/(biomeSpacing*2))
				var mountaines = biomeNoise2((x + i)/200, (z + k)/200)
				var biomerng = biomeNoise3((x + i)/biomeSpacing, (z + k)/biomeSpacing)
				var biome = getBiome((x + i), (z + k),temperature, mountaines, biomerng)
				biometable.set(i, k, biome) 
				for (var j = 0; j < dy; j++) {
					var cave = getCave(x + i, y + j, z + k)
					var height = getHeight(x + i, y + j, z + k, cave, mountaines)
					var block = getBlock(x + i, y + j, z + k, height, biome)
					
					if (block != 0) chunk.set(i, j, k, block)
				}
			}
		}
		saveChunk(id, chunk, 'populate', biometable)

		function getBlock(x, y, z, height, biome) {
			if (y >= 30 && y <= height) return blockIDs.stone
			if (y > height) return 0
			if (y == height && y > 0) {
				if (biome == 'plants' || biome == 'forest') return blockIDs.grass
				else if (biome == 'iceland') return blockIDs.grass_snow
				else if (biome == 'desert') return blockIDs.sand
			}
			else if (y+3 < height) {
				return blockIDs.stone
			}
			if (y < height && y > 0) {
				if (biome == 'plants' || biome == 'forest' || biome == 'iceland') return blockIDs.dirt
				else if (biome == 'desert') return blockIDs.sand
			}
		}

		function getHeight(x, y, z, cave, mountaines) {
			
			var layer1 = heightNoise(x/40, z/40)*mountaines-cave
			var layer2 = heightNoise(x/20, z/20)-cave
			var layer3 = heightNoise(x/10, z/10)-cave

			var noise = Math.round((layer1*20*20+layer2*20*10+layer3*20*5)/35) + 15
			return noise
		}

		function getBiome(x, z, temperature, mountaines, biomerng) {
			var rnd = hash(x, z)/100
			if (temperature + rnd > 0.6 && biomerng + rnd < 0) return 'desert'
			else if (temperature + rnd >= -0.1 && biomerng + rnd < 0.2) return 'plants'
			else if (temperature + rnd < -0.1 && biomerng + rnd < 0.2) return 'iceland'

			else if (temperature + rnd >= 0.2 && biomerng + rnd > 0.6) return 'forest'
			else return 'plants'
		}
		function getCave(x, y, z) {
			var noise = (caveNoise(x/20, y/20, z/20) > 0.45) ? caveNoise(x/20, y/20, z/20) : 0
			var line = Math.ceil(Math.abs(caveNoise2(x/10, y/10, z/10)))
			return Math.round(noise*line)
		}
	}

	async function populateChunk(chunk, x, y, z, id, biometable) {
		var toUpdate = {}
		var dx = chunk.shape[0]
		var dy = chunk.shape[1]
		var dz = chunk.shape[2]
		for (var i = 0; i < dx; i++) {
			for (var k = 0; k < dz; k++) {
				var biome = biometable.get(i, k)
				for (var j = 0; j < dy; j++) {
					if (getBlock(i, j, k) == blockIDs.grass && hash(x+i, z+k) > 0.8 ) {
						setBlock(i, j+1, k, blockIDs.grass_plant)
					} else if (getBlock(i, j, k) == blockIDs.grass && hash((x+i), (z+k)) < 0.05 ) {
						if (hash(x+i+z+k) >= 0.5) setBlock(i, j+1, k, blockIDs.red_flower)
						else setBlock(i, j+1, k, blockIDs.yellow_flower)
					} else if (getBlock(i, j, k) == blockIDs.grass && hash((x+i)*seed, (z+k)*seed) < 0.002 && biome == 'plants' ) {
						tree(i, j, k, y+j)
					} else if (getBlock(i, j, k) == blockIDs.grass && hash((x+i)*seed, (z+k)*seed) < 0.02 && biome == 'forest' ) {
						tree(i, j, k, y+j)
					} else if (getBlock(i, j, k) == blockIDs.sand && getBlock(i, j+1, k) == 0  && hash((x+i)*seed, (z+k)*seed) < 0.01 && biome == 'desert' ) {
						var w = 3 + (hash(i, k) >= 0.5) ? 1 : 0
						for (var h = 0; h <= w; h++) {
							setBlock(i, j+h+1, k, blockIDs.cactus)
						}
					}

					if (id == '0|0|0|temp') {
						var block
						if (i == 23 && j == 23 && k == 23) block = blockIDs.bricks
						else if (i == 0 && j == 0 && k == 0) block = blockIDs.planks
						else block = blockIDs.glass
						setBlock(i+20, j+20, k+20, block)
					}
				}
			}
		}
		saveChunk(id, chunk, 'generated')
		var updated = Object.entries(toUpdate)
		for (var w = 0; w < updated.length; w++) {
			//sendDebug(updated[w])
			if (updated[w][1][1] == 'generated' ) updateChunk(updated[w][0], updated[w][1][0])
		}


		function getBlock(x, y, z) {
			if (x >= 0 && x < dx && y >= 0 && y < dy && z >= 0 && z < dz) { return chunk.get(x, y, z) }
			else { 
				var splitID = id.split("|")
				var tempX = (x >= 0 && x < dx ) ? x : ((x < 0) ? x + dx : x - dx )
				var tempY = (y >= 0 && y < dy ) ? y : ((y < 0) ? y + dy : y - dy )
				var tempZ = (z >= 0 && z < dz ) ? z : ((z < 0) ? z + dz : z - dz )

				for (var w = 0; w < 3; w++) {splitID[w] = parseInt(splitID[w])}

				splitID[0] = (x >= 0 && x < dx ) ? splitID[0] : ((x < 0) ? splitID[0]-1 : splitID[0]+1)
				splitID[1] = (y >= 0 && y < dy ) ? splitID[1] :((y < 0) ? splitID[1]-1 : splitID[1]+1)
				splitID[2] = (z >= 0 && z < dz ) ? splitID[2] : ((z < 0) ? splitID[2]-1 : splitID[2]+1)

				var tempID = splitID[0] + '|' + splitID[1] + '|' + splitID[2] + '|' + splitID[3]
				
				var tempChunk = new ndarray( new Uint16Array(chunksize * chunksize * chunksize), [chunksize, chunksize, chunksize] )
				if (chunkIsStored(tempID)) { var state = retrieveChunk(tempID, tempChunk) }
				return tempChunk.get(tempX, tempY, tempZ, block)
			}
		}

		async function setBlock(x, y, z, block) {
			if (x >= 0 && x < dx && y >= 0 && y < dy && z >= 0 && z < dz) { chunk.set(x, y, z, block) }
			else { 
				var splitID = id.split("|")
				var tempX = (x >= 0 && x < dx ) ? x : ((x < 0) ? x + dx : x - dx )
				var tempY = (y >= 0 && y < dy ) ? y : ((y < 0) ? y + dy : y - dy )
				var tempZ = (z >= 0 && z < dz ) ? z : ((z < 0) ? z + dz : z - dz )

				for (var w = 0; w < 3; w++) {splitID[w] = parseInt(splitID[w])}

				splitID[0] = (x >= 0 && x < dx ) ? splitID[0] : ((x < 0) ? splitID[0]-1 : splitID[0]+1)
				splitID[1] = (y >= 0 && y < dy ) ? splitID[1] :((y < 0) ? splitID[1]-1 : splitID[1]+1)
				splitID[2] = (z >= 0 && z < dz ) ? splitID[2] : ((z < 0) ? splitID[2]-1 : splitID[2]+1)

				var tempID = splitID[0] + '|' + splitID[1] + '|' + splitID[2] + '|' + splitID[3]

				//sendDebug(splitID)
				//sendDebug(tempID)
				//sendDebug([tempX, tempY, tempZ])
				
				var tempChunk = new ndarray( new Uint16Array(chunksize * chunksize * chunksize), [chunksize, chunksize, chunksize] )
				if (chunkIsStored(tempID)) { var state = retrieveChunk(tempID, tempChunk) }
				tempChunk.set(tempX, tempY, tempZ, block)
				saveChunk(tempID, tempChunk)
				toUpdate[tempID] = [tempChunk, state]
			}
		}

		function tree(x, y, z, height) {
			var treelo = y+1
			// build the treetrunk
			var treehi = treelo + 6 + Math.floor(4*hash(x,z,1))
			for (var w = treelo; w < treehi; w++) {
				setBlock( x, w, z, blockIDs.log )
			}
			// spherical-ish foliage
			for (var ci=-4; ci<=4; ++ci) { 
				for (var cj=-4; cj<=4; ++cj) { 
					for (var ck=-4; ck<=4; ++ck) {
						if (ci===0 && ck===0 && cj<0) continue
						var rad = ci*ci + cj*cj + ck*ck
						if (rad>15) continue
						if (rad>5) {
							if (rad*hash(x+z+y+cj,ci,ck,cj) < 5) continue
						}
						setBlock( x+ci, treehi+cj, z+ck, blockIDs.leaves )
					}
				}
			}
		}
	}
}