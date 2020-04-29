
import { makeNoise2D, makeNoise3D } from 'open-simplex-noise'


var hash = require('murmur-numbers')

var ndarray = require('ndarray')

var cruncher = require('voxel-crunch')
var storage = {}
var chunkIsStored = (id) => { return !!storage[id] }
var storeChunk = (id, arr) => { storage[id] = cruncher.encode(arr.data) }
var retrieveChunk = (id, arr) => { cruncher.decode(storage[id], arr.data) }

// plumbing

var worldgen = new WorldGen()
self.onmessage = function (ev) { worldgen.onMessage(ev) }

function WorldGen() {
	var blockIDs = {}
	var heightNoise
	var caveNoise
	var biomeNoise1
	var biomeNoise2
	var biomeNoise3
	var seed
	var world
	this.onMessage = function (ev){
		var msg = ev && ev.data && ev.data.msg
		if (!msg) return

		if (msg=='init') {
			blockIDs = ev.data.blocks
			seed = ev.data.seed
			world = ev.data.world
			heightNoise = makeNoise2D(seed)
			caveNoise = makeNoise3D(seed)
			biomeNoise1 = makeNoise2D(seed*100/17)
			biomeNoise2 = makeNoise2D(seed*100/71)
			biomeNoise3 = makeNoise2D(seed*100/942)
		}

		if (msg=='savechunk') {
			var d = ev.data
			var array = new ndarray( d.data, d.shape )
			storeChunk(d.id, array)
		}

		if (msg=='generate') {
			var d = ev.data
			var array = new ndarray( d.data, d.shape )
			getChunk(d.id, array, d.x, d.y, d.z)

			// when done, return the ndarray to main thread
			self.postMessage({
				msg: 'generated',
				data: array.data,
				shape: array.shape,
				id: d.id
			})
		}
	}

	function getChunk(id, chunk, x, y, z) {
		if (chunkIsStored(id)) retrieveChunk(id, chunk)
		else {
			generateChunk(chunk, x, y, z)
		}
	
	}
	// two versions of world data
	// `data` is an ndarray - see https://github.com/scijs/ndarray
	async function generateChunk(chunk, x, y, z) {
		var dx = chunk.shape[0]
		var dy = chunk.shape[1]
		var dz = chunk.shape[2]
		for (var i = 0; i < dx; ++i) {
			for (var k = 0; k < dz; ++k) {
				for (var j = 0; j < dy; ++j) {
					var gen = getBiomeMap(x + i, y + j, z + k)
					var height = getHeightMap(x + i, y + j, z + k, 80, gen)
					var id = decideBlock(x + i, y + j, z + k, height, gen)
					if (id) chunk.set(i, j, k, id)
					if (id == blockIDs.grass && hash(x + i, y + j, z + k) < 0.05) chunk.set(i, j+1, k, (hash(x + i, z + k) >= 0.5) ? blockIDs.yellow_flower : blockIDs.red_flower)
					else if (id == blockIDs.grass && hash(x + i, y + j, z + k) > 0.85) chunk.set(i, j+1, k, blockIDs.grass_plant)
				}
			tree(chunk, x, y, z, height, i, k)
			}
		}
	}


	// helpers
	// worldgen - return a heightmap for a given [x,z]
	function getHeightMap(x, y, z, gen) {
		var scale = 20 + ( (gen['hight'] != undefined) ? gen['hight'] : 0 )
		//var cave = Math.round(caveNoise(x/50, y/50, z/50))*50
		var height = Math.round(heightNoise(x/15, z/15)*heightNoise(x/50, z/50)*scale)+10
		return height
				
	}


	function getBiomeMap(x, y, z) {
		var height = biomeNoise1(x/160, z/160)/10
		var biome = biomeNoise2(x/160, z/160)*10+hash(x, z)/100
		var r = {biome: biome, height: height}
		return r
		
	}


	function decideBlock(x, y, z, height, gen) {
		var hash2 = hash(x,z)
		var hash3 = hash(x, y, z)
		if (y > 1000 || y < -1000 ) {
			return blockIDs.barrier
		} else if (y < -990) {
			return stoneBlock(y, hash3)
		} else if (y+3 < height) {
			return stoneBlock(y, hash3)
		} else if (y > 38-hash2*3 && (y == height || y+1 == height)) {
			return blockIDs.snow
		} else if (y > 30-hash2*3 && y <= height) {
			return stoneBlock(y, hash3)
		} else if (y < height && y > -40) {
			if (y < 0 ) return blockIDs.sand
			return blockIDs.dirt
		} else if (y == height && y > -40) {
			if (y < 1) return blockIDs.sand
			return blockIDs.grass
		} else {
			return (y < -1 && y > -40) ? blockIDs.water : 0
		}
		function stoneBlock(y, rnd) {
			if (y < 50 && rnd < 0.05) return blockIDs.coal
			else if (y < 40 && rnd > 0.98) return blockIDs.iron
			else return blockIDs.stone
		}
	}


	// After the world is initialzed, fill in a bunch of test blocks. 
	// There's no particular significance to these, I use them to 
	// debug meshing and AO and whatnot

	setTimeout(function () {
		//addWorldFeatures()
	}, 1000)

	//function tree() {}

	//*
	function tree(chunk, xoff, yoff, zoff, height, i, k) {
		// no trees at/near water level
		if (height <= 3) return
		// leave if chunk is above/below tree height
		var js = chunk.shape[1]
		var treelo = height
		var treemax = treelo + 20
		if (yoff>treemax || yoff+js<treelo) return
		// don't build at chunk border for now
		var border = 5
		if (i<border || k<border) return
		var is = chunk.shape[0]
		var ks = chunk.shape[2]
		if (i>is-border || k>ks-border) return
		// sparse trees
		var x = xoff + i
		var z = zoff + k
		var thash = hash(x, z)
		if (Math.floor(200*thash)!==0) return

		// build the treetrunk
		var treehi = treelo + 7 + Math.floor(6*hash(x,z,1))
		for (var y=treelo; y<treehi; ++y) {
			var j = y-yoff
			if (j<0 || j>=js) continue
			chunk.set( i,j,k, blockIDs.log );
		}

		// spherical-ish foliage
		for (var ci=-4; ci<=4; ++ci) { 
			for (var cj=-4; cj<=4; ++cj) { 
				for (var ck=-4; ck<=4; ++ck) {
					var tj = treehi + cj - yoff
					if (ci===0 && ck===0 && cj<0) continue
					if (tj<0 || tj>=js) continue
					var rad = ci*ci + cj*cj + ck*ck
					if (rad>16) continue
					if (rad>5) {
						if (rad*hash(x+z+tj,ci,ck,cj) < 5) continue;
					}
					chunk.set( i+ci, tj, k+ck, blockIDs.leaves );
				}
			}
		}
	}
	//*/

	function makeRows(length, x, z, block) {
		for (var i = 0; i < length; i++) {
			noa.setBlock(block, x + i, 1, z + i)
			noa.setBlock(block, length * 2 + x - i, 1, z + i)
		}
	}
}

