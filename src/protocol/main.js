import { setChunk } from "./world"
import { addTextInChat } from "../gui/chat"
var ndarray = require('ndarray')
const cruncher = require('voxel-crunch')


export function initProtocol(game, socket, noa) {

	noa.world.on('worldDataNeeded', function (id, array, x, y, z) {

	})

	socket.on('login-request', function(data) {
		socket.emit('login', {
			username: game.username,
			protocol: 1
		})

		socket.on('kick', function(data) {
			//Todo: better kick handling
			console.log('You has been kicked from server \nReason: ' + data)
			return
		})

		socket.on('chat', function(data) {
			//Chat support
			addTextInChat(data)
			console.log(data)
		})

		socket.on('chunkdata', function(data) {
			var chunkdata = cruncher.decode(Object.values(data.chunk), new Uint16Array(24 * 120 * 24))
			var array = new ndarray(chunkdata, [24, 120, 24])
			setChunk(data.id, array, noa)
		})

		socket.on('block-update', function(data) {
			noa.setBlock(data.id, data.pos)
		})

		socket.on('inventory-update', function(data) {
			noa.entities.getState(noa.playerEntity, 'inventory').main = data.main
			noa.entities.getState(noa.playerEntity, 'inventory').tempslot = data.tempslot
		})

		var lastPos = JSON.stringify(noa.entities.getState(noa.playerEntity, 'position').position)

		setInterval( async function() {
			var newPos = JSON.stringify(noa.entities.getState(noa.playerEntity, 'position').position)
			if (lastPos != newPos) {
				socket.emit('move', noa.entities.getState(noa.playerEntity, 'position').position)
			}
		}, 100)
	})
}


export function sendPacket(type, data) {
	socket.emit(type, data)
	console.log(type, data)
}