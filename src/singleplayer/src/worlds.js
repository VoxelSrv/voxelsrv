var worlds = {}

var baseMetadata = {gen: true, ver: 1}

function createWorld(name, seed, generator) {
	if ( existWorld(name) == false && worlds[name] == undefined ) {
		worlds[name] = new World(name, seed, generator)
	}
}

function loadWorld(name) {

}

function unloadWorld(name) {

}

function existWorld(name) {
	return fs.existsSync( './worlds/' + name + '.chk')
}

function getWorld(name) {
	return worlds[name]
}

class World {
	constructor(name, seed, generator) {
		this.name = name,
		this.seed = seed,
		this.generator = generator
		this.chunks = {}
		this.folder = './worlds/' + name + '/'
		this.chunkFolder = './worlds/' + name + '/chunks/'
	}

	getChunk(id, bool) {
		if (this.chunks[id] != undefined) {
			return this.chunks[id]
		}
		else if ( existChunk(id).metadata ) {
			var data = this.readChunk(id)
			this.chunks[id] = new Chunk(id, data.chunk, data.metadata)
			return this.chunk[id]
		}
		if (bool) {
			if ( existChunk(id).chunk ) {
				var data = this.readChunk(id)
				this.chunks[id] = new Chunk(id, data.chunk, {...baseMetadata})
				return this.chunk[id]
			} else {
				this.chunks[id] = this.genetateChunk(id)
				return this.chunk[id]
			}
		}
	}

	existChunk(id) {
		var chk = fs.existsSync(this.chunkFolder + id + '.chk')
		var meta = fs.existsSync(this.chunkFolder + id + '.json')
		return {chunk: chk, metadata: meta}
	}

	readChunk(id) {
		var exist = existChunk(id)
		var chunk = null
		var meta = null
		if (exist.chunk) {
			var data = fs.readFileSync(this.chunkFolder + id + '.chk')
			var array = crunch.decode([...data], new Uint16Array(24*120*24) )
			chunk = new ndarray(array, [24, 120, 24])
		}
		if (exist.metadata) {
			var data = fs.readFileSync(this.chunkFolder + id + '.json')
			var meta = JSON.parse(data)
		}
		return {chunk: chunk, metadata: meta}
	}
}


class Chunk {
	const(id, blockdata, metadata, bool) {
		this.id = id
		this.data = blockdata
		this.metadata = metadata
		this.lastUse = Date.now()
		this.forceload = !!bool
	}

	keepAlive() {
		this.lastUse = Date.now()
	}
}

module.exports = {
	create: createWorld,
	load: loadWorld,
	unload: unloadWorld,
	exist: existWorld,
	get: getWorld
}