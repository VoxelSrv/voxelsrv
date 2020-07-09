var fs = require('fs')
const crunch = require("voxel-crunch")
const ndarray = require('ndarray')


module.exports = { 
	save: saveChunk,
	savePlayer: savePlayer,
	read: readChunk,
	readData: readChunkData,
	readPlayer: readPlayer,
	exist: existChunk,
	existData: existChunkData,
	existPlayer: existPlayer

}


function saveChunk(id, chunk, json) {
	var data = Buffer.from( crunch.encode(chunk.data) )

	fs.writeFile('./world/chunks/' + id +'.chk', data, function (err) {
		if (err) console.error ('Cant save chunk ' + id + '! Reason: ' + err);
	})

	fs.writeFile('./world/chunks/' + id + '.json', JSON.stringify(json), function (err) {
		if (err) console.error ('Cant save chunkdata ' + id + '! Reason: ' + err);
	})
}

function savePlayer(id, data) {
	fs.writeFile('./world/players/' + id +'.json', JSON.stringify(data), function (err) {
		if (err) console.error ('Cant save player ' + id + '! Reason: ' + err);
	})
}


function readChunk(id) {
	var r = false
	var name = id + '.chk'
	var data = fs.readFileSync('./world/chunks/' + name)
	var array = crunch.decode([...data], new Uint16Array(24*120*24) )
			
	r = new ndarray(array, [24, 120, 24])
	return r
}

function readChunkData(id) {
	var r = false
	var name = id + '.json'
	var data = fs.readFileSync('./world/chunks/' + name)
	r = JSON.parse(data)			
	return r
}

function readPlayer(id) {
	var r = false
	var name = id + '.json'
	var data = fs.readFileSync('./world/players/' + name)
	r = JSON.parse(data)
	return r
}


function existChunk(id) {
	var name = id + '.chk'
	var r = fs.existsSync('./world/chunks/' + name)
	return r
}

function existChunkData(id) {
	var name = id + '.json'
	var r = fs.existsSync('./world/chunks/' + name)
	return r
}

function existPlayer(id) {
	var name = id + '.json'
	var r = fs.existsSync('./world/players/' + name)
	return r
}