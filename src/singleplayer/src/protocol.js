const EventEmiter = require('events')
const event = new EventEmiter()

module.exports = {
	init(io) { initProtocol(io) },
	send(id, type, data) { sendPacket(id, type, data) },
	sendAll(type, data) { io.emit(type, data) },
	getSocket(id) { return connections[id] },
	event: event

}


const illegalCharacters = new RegExp('[^a-zA-Z0-9]')
const players = require('./player')
const chat = require('./chat')
const items = require('./items').get()
const blockIDs = require('./blocks').getIDs()
const blocks = require('./blocks').get()
var protocol = 1

var cfg = require('../config.json')
const entity = require('./entity')

var connections = {}
var playerCount = 0
var io

var init = false

function initProtocol(io0) {
	if (init == true) return
	init = true
	io = io0
	io.on('connection', async function(socket) {
		if (playerCount >= cfg.maxplayers) {
			socket.emit('kick', 'Server is full')
			socket.disconnect(true)
		}

		socket.emit('login-request', {
			name: cfg.name,
			protocol: protocol,
			maxplayers: cfg.maxplayers,
			blocks: blocks,
			blockIDs: blockIDs,
			items: items
		})

		var loginTimeout = true

		socket.on('login', function(data) { 
			loginTimeout = false

			var check = verifyLogin(data)
			if (data.username == '' || data.username == null || data.username == undefined ) data.username = 'Player' + Math.round(Math.random()*100000)

			var id = data.username.toLowerCase()

			if (check != 0) {
				socket.emit('kick', check)
				socket.disconnect(true)
			} if (connections[id] != undefined) {
				socket.emit('kick', 'Player with that nickname is already online!')
				socket.disconnect(true)
			} else {
				players.event.emit('connection', id)
				var player = players.create(id, data, socket)

				socket.emit('login-success', {
					pos: player.entity.data.position,
					inv: player.inventory,
					clientSideBlockPrediction: true,
					blocks: blocks,
					blockIDs: blockIDs,
					items: items
				})
				connections[id] = socket

				socket.emit('entity-ignore', player.entity.id)

				Object.entries( entity.getAll() ).forEach(function(data) {
					socket.emit('entity-spawn', {
						id: data[0],
						data: data[1].data
					})
				})

				chat.send(-2, player.nickname + " joined the game!")
				playerCount = playerCount + 1

				socket.on('disconnect', function() {
					players.event.emit('disconnect', id)
					chat.send(-2, player.nickname + " left the game!")
					player.remove()
					connections[id] = null
					delete connections[id]
					playerCount = playerCount - 1 
				})
				socket.on('chat-send', function(data) {
					player.action_chatsend(data)
				})

				socket.on('block-break', function(data) {
					player.action_blockbreak(data)
				})

				socket.on('block-place', function(data) {
					player.action_blockplace(data)
				})

				socket.on('move', function(data) {
					player.action_move(data)
				})

				socket.on('inventory-click', function(data) {
					player.action_invclick(data)
				})

		}
		})

		setTimeout(function() {
			if (loginTimeout == true) { 
				socket.emit('kick', 'Timeout')
				socket.disconnect(true)
			}
		}, 1000)

	})


}

function sendPacket(id, type, data) {
	if (id == -1) io.emit(type, data)
	else if (connections[id] != undefined) connections[id].emit(type, data)
}

function verifyLogin(data) {
	if (data == undefined) return 'No data!'
	else if (data.username == undefined || illegalCharacters.test(data.username)) return 'Illegal username - ' + data.username
	else if (data.protocol == undefined || data.protocol != protocol) return 'Unsupported protocol'

	return 0
}


