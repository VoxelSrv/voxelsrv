/*
 Worldgen worker,

 Todo:
- Optimise it's speed
- Move getBlock and similiar functions outside generateChunk and similiar
- Better biome generation, more biomes?
- Save/load data from web storage (maybe use this? https://localforage.github.io/localForage/)

*/

import { makeNoise2D, makeNoise3D, makeNoise4D } from 'open-simplex-noise'


var hash = require('murmur-numbers')

var ndarray = require('ndarray')

var cruncher = require('voxel-crunch')
var storage = {}

// plumbing

// Checking if chunk exist
function chunkIsStored(id) {
	if (storage[id]) var x = true
	else var x = false
	
	return x
}

// Saving chunk
async function saveChunk(id, arr, state, biometable) {
	if (storage[id] == undefined) storage[id] = {}
	storage[id].chunk = cruncher.encode(arr.data)
	if (state) {
		storage[id].state = state
	}
	if (biometable) {
		storage[id].biometable = biometable
	}
}

// Reading chunk
function retrieveChunk(id, arr) {
	cruncher.decode(storage[id].chunk, arr.data)
	var state = storage[id].state
	return state
}


var worldgen = new WorldGen()
self.onmessage = function (ev) { worldgen.onMessage(ev) }

function WorldGen() {
	var init = false
	var blockIDs = {}
	var heightNoise, caveNoise, biomeNoise1, biomeNoise2, biomeNoise3, seed, world, plantSeed
	var chunksize = 24
	var waterLevel = 18
	this.onMessage = function (ev){
		var msg = ev && ev.data && ev.data.msg
		if (!msg) return

		if (msg=='init') { // Init data
			init = true
			blockIDs = ev.data.blocks
			seed = ev.data.seed
			world = ev.data.world
			chunksize = ev.data.chunksize
			heightNoise = makeNoise2D(Math.round(seed * Math.sin(seed^1) * 10000))
			caveNoise = makeNoise3D(Math.round(seed * Math.sin(seed^2) * 10000))
			biomeNoise1 = makeNoise2D(Math.round(seed * Math.sin(seed^3) * 10000))
			biomeNoise2 = makeNoise2D(Math.round(seed * Math.sin(seed^4) * 10000))
			biomeNoise3 = makeNoise2D(Math.round(seed * Math.sin(seed^5) * 10000))
			plantSeed = Math.round(seed * Math.sin(seed^6) * 10000) 
			self.postMessage({
				msg: 'initialized'
			})

		}
		if (msg=='savechunk') { // Save chunk
			var d = ev.data
			var array = new ndarray( d.data, d.shape )
			if (Math.abs(d.id.split("|")[1]) < 24) saveChunk(d.id, array, 'generated')
		}

		if (msg=='generate') { // Generete/send chunk
			var d = ev.data
			var array = new ndarray( d.data, d.shape )
			getChunk(d.id, array, d.x, d.y, d.z, 'generated')

			// when done, return the ndarray to main thread
			updateChunk(d.id, array)
		}
	}
	function updateChunk(id, array) { // Sends chunk to main thread
		self.postMessage({
			msg: 'generated',
			data: array.data,
			shape: array.shape,
			id: id
		})
	}

	function getChunk(id, chunk, x, y, z, state) { // Gets chunk (if it exist) or generates one
		if (chunkIsStored(id)) { var result = retrieveChunk(id, chunk) }
		if (chunkIsStored(id) && result == 'populate') populateChunk(chunk, x, y, z, id)
		else if (chunkIsStored(id) && result == state) {}
		else {
			var biometable = ndarray(new Array, [chunksize, chunksize])

			generateChunk(chunk, x, y, z, id, biometable)
			changeBlocksChunk(chunk, x, y, z, id, biometable)
			populateChunk(chunk, x, y, z, id, biometable)
		}
	}

	function sendDebug(debug) { //Just for sending info to console
		self.postMessage({
			msg: 'debug',
			data: debug
		})
	}

	var biomeSpacing = 100 // Size of biomes

	// Generates stone (or barrier) heightmap.
	// Todo: use less noise effects to get something similiar
	async function generateChunk(chunk, x, y, z, id, biometable) { 
		var dx = chunk.shape[0]
		var dy = chunk.shape[1]
		var dz = chunk.shape[2]
		if (Math.abs(id.split("|")[1]) >= 24) {
			for (var i = 0; i < dx; i++) {
				for (var k = 0; k < dz; k++) {
					for (var j = 0; j < dy; j++) {
						chunk.set(i, j, k, blockIDs.barrier)
					}
				}
			}
		}
		else {
			for (var i = 0; i < dx; i++) {
				for (var k = 0; k < dz; k++) {
					var temperature = biomeNoise1((x + i)/biomeSpacing, (z + k)/biomeSpacing)
					var mountaines = biomeNoise2((x+i)/180, (z+k)/180)
					var biomerng = Math.round(biomeNoise3((x + i)/biomeSpacing/10, (z + k)/biomeSpacing/10)+1)
					var biome = getBiome((x + i), (z + k),temperature, mountaines, biomerng)
					biometable.set(i, k, biome) 
					for (var j = 0; j < dy; j++) {
						var height = getHeightMap(x + i, y + j, z + k, mountaines)
						var block = getBlock(y + j, height)
						if (block != 0) chunk.set(i, j, k, block)
					}
				}
			}
			saveChunk(id, chunk, 'populate', biometable)
		}
		function getBlock(y, height) {
			if (y <= height) return blockIDs.stone
			else if (y <= waterLevel) return blockIDs.water
			else return 0
		}

		function getBiome(x, z, temperature, mountaines, biomerng) {
			if (0.2 < temperature && biomerng == 1) return 'desert'
			else if ( -1 < temperature < -0.2 && biomerng == 1) return 'iceland'
			else if ( -0.3 < temperature < 0.3 && biomerng == 2) return 'forest'
			else return 'plants'
		}
	}

	// Replaces stone with biome-based blocks
	// Maybe merge it with generateChunk?
	async function changeBlocksChunk(chunk, x, y, z, id, biometable) { 
		var dx = chunk.shape[0]
		var dy = chunk.shape[1]
		var dz = chunk.shape[2]
		
		for (var i = 0; i < dx; i++) {
			for (var k = 0; k < dz; k++) {
				var m = biomeNoise2((x+i)/180, (z+k)/180)
				var biome = biometable.get(i, k)
				for (var j = 0; j < dy; j++) {
					var rnd = (hash(x+i, y+j, z+k) < 0.2 ? 1 : 0) 
					if (0 < y+j < 50 && getBlock(x+i, y+j, z+k, m) == 1 && getBlock(x+i, y+j+1, z+k, m) == 0 ) {
						if (biome == 'plants' || biome == 'forest') chunk.set(i, j, k, blockIDs.grass)
						else if (biome == 'iceland') chunk.set(i, j, k, blockIDs.grass_snow)
						else if (biome == 'desert') chunk.set(i, j, k, blockIDs.sand)
					}
					else if (getBlock(x+i, y+j+1, z+k, m) != 0 && getBlock(x+i, y+j, z+k, m) != blockIDs.water && getBlock(x+i, y+j+3+rnd, z+k, m) == 0) {
						if (biome == 'plants' || biome == 'forest' || biome == 'iceland') chunk.set(i, j, k, blockIDs.dirt)
						else if (biome == 'desert') chunk.set(i, j, k, blockIDs.sand)
					}
					else if (getBlock(x+i, y+j+1, z+k, m) == blockIDs.water && getBlock(x+i, y+j, z+k, m) != 0 && getBlock(x+i, y+j, z+k, m) != blockIDs.water) {
						chunk.set(i, j, k, blockIDs.gravel)
					}
				}
			}
		}
		saveChunk(id, chunk, 'populate', biometable)


		function getBlock(x, y, z, m) {
			var r = getHeightMap(x, y, z, m)

			if (y <= r) return blockIDs.stone
			else if (y <= waterLevel) return blockIDs.water
			else return 0
		}

	}


	// Populates chunk with plants and ores
	async function populateChunk(chunk, x, y, z, id, biometable) {
		var toUpdate = {}
		var dx = chunk.shape[0]
		var dy = chunk.shape[1]
		var dz = chunk.shape[2]
		for (var i = 0; i < dx; i++) {
			for (var k = 0; k < dz; k++) {
				var biome = biometable.get(i, k)
				for (var j = 0; j < dy; j++) {
					if (getBlock(i, j, k) == blockIDs.stone) {
						if (y < 30 && hash((x+i), (y+j), (z+k), plantSeed) <= 0.05) setBlock(i, j, k, blockIDs.coal_ore)
						if (y < 15 && hash((x+i), (y+j), (z+k), plantSeed^2) <= 0.01) setBlock(i, j, k, blockIDs.iron_ore) 

					} else if (getBlock(i, j+1, k) == 0 && getBlock(i, j, k) == blockIDs.grass && hash((x+i), (z+k), plantSeed) > 0.8 ) {
						setBlock(i, j+1, k, blockIDs.grass_plant)
					} else if (getBlock(i, j+1, k) == 0 && getBlock(i, j, k) == blockIDs.sand && hash((x+i), (z+k), plantSeed) < 0.02 ) {
						setBlock(i, j+1, k, blockIDs.deadbush)
					} else if (getBlock(i, j, k) == blockIDs.grass && hash((x+i), (z+k), plantSeed^2) < 0.05 ) {
						if (hash(x+i, z+k) >= 0.5) setBlock(i, j+1, k, blockIDs.red_flower)
						else setBlock(i, j+1, k, blockIDs.yellow_flower)
					} else if (getBlock(i, j, k) == blockIDs.grass && hash((x+i), (z+k), plantSeed) < 0.002 && biome == 'plants' ) {
						tree(i, j, k, y+j)
					} else if (getBlock(i, j, k) == blockIDs.grass && hash((x+i), (z+k), plantSeed) < 0.02 && biome == 'forest' ) {
						tree(i, j, k, y+j)
					} else if (getBlock(i, j, k) == blockIDs.sand && getBlock(i, j+1, k) == 0 && 
							hash((x+i), (z+k), plantSeed*2) < 0.02 && biome == 'desert' && getBlock(i, j+1, k+1) == 0 &&
							getBlock(i, j+1, k-1) == 0 && getBlock(i+1, j+1, k) == 0 && getBlock(i-1, j+1, k) == 0 ) {
						var w = 1 + ((hash((x+i), (z+k), plantSeed) >= 0.5) ? 1 : 0)
						for (var h = 0; h <= w; h++) {
							setBlock(i, j+h+1, k, blockIDs.cactus)
						}
					}
				}
			}
		}
		saveChunk(id, chunk, 'generated')
		var updated = Object.entries(toUpdate)
		for (var w = 0; w < updated.length; w++) {
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
				return tempChunk.get(tempX, tempY, tempZ)
			}
		}

		function setBlock(x, y, z, block) {
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

	function getHeightMap(x, y, z, mountaines) {
		var dim = (caveNoise(x/50, y/50, z/50)+0.35)*50
		var dim2 = (caveNoise(x/20, y/20, z/20))*50
		var layer1 = heightNoise(x/140, z/140)*mountaines*20
		var layer2 = heightNoise(x/40, z/40)*20
		
		return Math.floor((dim*30+dim2*20+layer1*20+layer2*10-3)/65) + 15
	}
}