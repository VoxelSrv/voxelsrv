const EventEmiter = require('events')
const vec = require('gl-vec3')
const event = new EventEmiter()
const entity = require('./entity')
const world = require('./world/main')
const items = require('./items')
const blockIDs = require('./blocks').getIDs()
const blocks = require('./blocks').get()
const protocol = require('./protocol')
const compressChunk = require("voxel-crunch")
const chat = require('./chat')
const command = require('./commands').execute
const hook = require('./hooks')
const fs = require('fs')

var cfg = require('../config.json')
const { PlayerInventory } = require('./inventory')

var players = {}
var chunksToSend = []


function createPlayer(id, data, socket) {
	players[id] = new Player(id, data.username, socket)

	event.emit('create', players[id])

	return players[id]
}


function readPlayer(id) {
	var r = false
	var name = id + '.json'
	var data = fs.readFileSync('./players/' + name)
	r = JSON.parse(data)
	return r
}

function existPlayer(id) {
	var name = id + '.json'
	var r = fs.existsSync('./players/' + name)
	return r
}

function savePlayer(id, data) {
	fs.writeFile('./players/' + id +'.json', JSON.stringify(data), function (err) {
		if (err) console.error ('Cant save player ' + id + '! Reason: ' + err);
	})
}

class Player {
	constructor(id, name, socket) {
		this.id = id
		this.nickname = name
		if ( existPlayer(this.id) ) {
			var data = readPlayer(this.id)
			this.entity = entity.recreate(data.entity.id, {
				name: data.entity.data.name,
				nametag: data.entity.data.nametag,
				type: 'player',
				health: data.entity.data.health,
				maxhealth: data.entity.data.maxhealth,
				model: 'player',
				texture: 'entity/steve',
				position: data.entity.data.position,
				rotation: data.entity.data.rotation
			})

			this.inventory = new PlayerInventory(10, data.inventory)
		} else {
			this.entity = entity.create({
				name: name,
				nametag: true,
				type: 'player',
				health: 20,
				maxhealth: 20,
				model: 'player',
				texture: 'entity/steve',
				position: cfg.world.spawn,
				rotation: 0
			})

			this.inventory = new PlayerInventory(10)
		}
		this.socket = socket
		this.chunks = {}
		savePlayer(this.id, this.getObject())
	}

	getObject() {
		return {
			id: this.id,
			nickname: this.nickname,
			entity: this.entity.getObject(),
			inventory: this.inventory.getObject()
		}
	}

	remove() {
		savePlayer(this.id, this.getObject())
		this.entity.remove()
		delete players[this.id]
	}

	teleport(pos, eworld) {
		this.entity.teleport(pos, eworld)
		this.socket.emit('teleport', pos)
	}

	move(pos) {
		event.emit('player-move', {id: this.id, pos: pos})
		this.entity.move(pos)
	}

	rotate(rot) {
		event.emit('player-rotate', {id: this.id, rot: rot})
		this.entity.rotate(rot)
	}
	
	get getID() {
		return this.id
	}

	action_blockbreak(data) {
		var action = {id: this.id, data: data}
		var r = hook.execute('player-blockbreak', action)
		if (r == 1) return


		if (action.data != null || action.data.lenght == 3) {
			if ( Math.abs(action.data[0]) >= 120000 || Math.abs(action.data) >= 120000) {
				return
			}

			var block = world.getBlock(action.data)
			var pos = this.entity.data.position

			if (vec.dist(pos, action.data) < 14 && block != undefined && block != 0 && blocks[block].data.unbreakable != true) {
				//player.inv.add(id, blocks[block].data.drop, 1, {})
				world.setBlock(data, 0)
				protocol.sendAll('block-update', {
					id: 0,
					pos: action.data
				})
			}

		}
	}

	action_blockplace(data) {
		var action = {id: this.id, data: data}
		var r = hook.execute('player-blockplace', action)
		if (r == 1) return


		var inv = this.inventory
		var item = inv.main[inv.selected]
		var pos = this.entity.data.position


		if (vec.dist(pos, action.data) < 14 && item != undefined && item.id != undefined) {
			if (items.get()[item.id].type == 'block' || items.get()[item.id].type == 'block-flat') {
				//player.inv.remove(id, item.id, 1, {})
				world.setBlock(action.data, blockIDs[item.id])
				protocol.sendAll('block-update', {
					id: blockIDs[item.id],
					pos: action.data
				})
			}
		}
	}

	action_invclick(data) {
		if (data.inventory == undefined) data.inventory = this.inventory
		var action = {id: this.id, data: data}
		var r = hook.execute('player-inventoryclick', action)
		if (r == 1) return

		if (-2 < action.data.slot < 35) {
			if (action.data.type == 'left') this.inventory.action_left(action.data.inventory, action.data.slot)
			else if (action.data.type == 'right')  this.inventory.action_right(action.data.inventory, action.data.slot)
			else if (action.data.type == 'switch')  this.inventory.action_switch(action.data.slot, action.data.slot2)
			else if ( -1 < action.data.slot < 9 && action.data.type == 'select')  this.inventory.select(action.data.slot)
		}
	}


	action_chatsend(data) {
		var action = {id: this.id, data: data}
		var r = hook.execute('player-chatsend', action)
		if (r == 1) return

		if (action.data.charAt(0) == '/') {
			command(this.id, action.data)
		}
		else if (action.data != '' ) chat.send(-2, this.nickname + " » " + action.data)
	}

	action_move(data) {
		var action = {id: this.id, data: data}
		var r = hook.execute('player-move', action)
		if (r == 1) return

		var pos = this.entity.data.position
		if ( Math.abs(action.data.pos[0]) > 120000 || Math.abs(action.data.pos[2]) > 120000) {
			this.socket.emit('teleport', pos)
			return
		}
		if (vec.dist(pos, action.data.pos) < 20) this.move(action.data.pos)

		this.rotate(action.data.rot)
	}
}


setInterval(async function() {
	var list = Object.keys(players)

	var viewDistance = 3

	list.forEach(async function(id) {
		var chunk = players[id].entity.chunk
		var loadedchunks = {...players[id].chunks}
		for (var w = 0; w <= viewDistance; w++) {
			for (var x = 0 - w; x <= 0 + w; x++) {
				for (var z = 0 - w; z <= 0 + w; z++) {
					var tempid = [chunk[0] + x, chunk[1] + z]
					if (loadedchunks[tempid] == undefined) {
						players[id].chunks[tempid] = true
						chunksToSend.push([id, tempid])
					}
					world.keepChunkAlive(tempid)
					loadedchunks[tempid] = false
				}
			}
		}

		var toRemove = Object.entries(loadedchunks)
		toRemove.forEach(function(item) {
			if (item[1] == true) delete players[id].chunks[item[0]]
		})
	})
}, 1000)


setInterval(async function() {
	if (chunksToSend[0] != undefined) {
		sendChunkToPlayer(chunksToSend[0][0], chunksToSend[0][1])
		chunksToSend.shift()
	}
}, 100)

setInterval(async function() {
	var list = Object.values(players)
	list.forEach(function(player) {
		if (player.inventory.updated != true) {
			player.inventory.updated = true
			console.log(Date.now() - player.inventory.lastUpdate, Date.now(), player.inventory.lastUpdate)
			player.socket.emit('inventory-update', {...player.inventory})
		}
	})
}, 50)


function sendChunkToPlayer(id, cid) {
	event.emit('sendChunk', id, cid)
	world.chunk(cid).then(function(res) {
		if (res != undefined && players[id] != undefined) {
			world.keepChunkAlive(cid)
			var chunk = res.data
			players[id].socket.emit('chunkdata', {
				id: cid,
				chunk: compressChunk.encode(chunk)
			})
		}
	})
}

hook.create('player-blockbreak', 5)
hook.create('player-blockplace', 5)
hook.create('player-move', 5)
hook.create('player-inventoryclick', 5)
hook.create('player-chatsend', 5)


module.exports = {
	create: createPlayer,
	get(id) { return players[id] },
	getAll() { return players },
	event: event
}
