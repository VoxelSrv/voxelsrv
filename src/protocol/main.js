import { setChunk } from "./world"
import { addTextInChat } from "../gui/chat"
var ndarray = require('ndarray')

export function initProtocol(game, socket, noa) {
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
			var array = new ndarray(Object.values(data.chunk), [24, 120, 24])
			setChunk(data.id, array, noa)
		})

		socket.on('block-update', function(data) {
			noa.setBlock(data.id, data.pos)
		})

		setInterval( async function() {
			if (chunkList[0] != undefined) {
				socket.emit('chunk-request', chunkList[0])
				chunkList.shift()
			}
		}, 100)
	})
}


export function sendPacket(type, data) {
	socket.emit(type, data)
}