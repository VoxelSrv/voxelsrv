/*

const EventEmiter = require('events')

const fs = require('fs')

var version = '0.0.0'
var protocol = 2

console.log('Starting VoxelSRV server version ' + version + ' [Protocol: ' + protocol + ']\n')

var cfg = require('./config.json')

require('./src/blocks').init()
require('./src/items').init()


const worldManager = require('./src/worlds')
 
const serverMsg = new EventEmiter()
const io = new EventEmiter()

const socket = new EventEmiter()

socket.emit2 = socket.emit

self.onmessage = function(m) { 
	if (m[0] == 'message') socket.emit(m[1]) 
	else serverMsg.emit(m[0], m[1])
}

function packetToClient(packet) {
	self.postMessage(['message', packet])
}

function sendToClient(type, packet) {
	self.postMessage([type, packet])
}


socket.send = packetToClient
io.clients = [socket]

socket.close = function() { }


sendToClient('get-world', true)

serverMsg.on('select-world', function (x) {
	console.log('Test: ', x)
	fs.init(x).then( () => {
		setTimeout(() => {
			if (!fs.existsSync('./players') ) fs.mkdirSync('./players')
			if (!fs.existsSync('./worlds') ) fs.mkdirSync('./worlds')

			if (worldManager.exist('default') == false) worldManager.create('default', cfg.world.seed, cfg.world.generator)
			else worldManager.load('default') 

			require('./src/actions').init(wss)
			require('./src/protocol-helper').setWS(wss)
			require('./src/player').setIO(wss)
			require('./src/entity').setIO(wss)
			

			const players = require('./src/player')
			const items = require('./src/items') 


			players.event.on('create', function(player) {
				Object.keys( items.get() ).forEach(function(item) {
					player.inventory.add(item, items.getStack(item) , {})
				})	
			})
			setTimeout( () => { io.emit('connection', socket) }, 1000 )
		}, 500)

	})

})



*/