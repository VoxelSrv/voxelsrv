const EventEmiter = require('events')

const fs = require('./src/fs')

var version = '0.0.0'
var protocol = 2

console.log('Starting VoxelSRV server version ' + version + ' [Protocol: ' + protocol + ']\n')

var cfg = require('./config.json')

require('./src/blocks').init()
require('./src/items').init()


const worldManager = require('./src/worlds')
 

const io = new EventEmiter()
io.emit2 = io.emit

const socket = new EventEmiter()

socket.emit2 = socket.emit

self.onmessage = function(m) { socket.emit2(m) }

function emitToClient(type, packet) {
	self.postMessage([type, packet])
}

socket.emit = emitToClient
io.emit = emitToClient

socket.disconnect = function() { }


emitToClient('get-world', true)

socket.on('select-world', function (x) {
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
			setTimeout( () => { io.emit2('open', socket) }, 1000 )
		}, 500)

	})

})



