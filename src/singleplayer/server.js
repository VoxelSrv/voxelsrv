const EventEmiter = require('events')

const fs = require('./src/fs')

var version = game.version
var protocol = 1

console.log('Starting VoxelSRV server version ' + version + ' [Protocol: ' + protocol + ']\n')

var cfg = require('./config.json')

require('./src/blocks').init()
require('./src/items').init()

if (!fs.existsSync('./players') ) fs.mkdirSync('./players')
if (!fs.existsSync('./worlds') ) fs.mkdirSync('./worlds')


const worldManager = require('./src/worlds')

if (worldManager.exist('default') == false) worldManager.create('default', cfg.world.seed, cfg.world.generator)
else worldManager.load('default') 
 
const initProtocol = require('./src/protocol').init


const io = new EventEmiter()
io.emit2 = io.emit

const socket = new EventEmiter()

socket.emit2 = socket.emit

self.onmessage = function(m) { socket.emit2(m.data[0], m.data[1]) }

function emitToClient(type, packet) {
	self.postMessage([type, packet])
}

socket.emit = emitToClient
io.emit = emitToClient

socket.disconnect = function() { }


initProtocol(io)

setTimeout( () => { io.emit2('connection', socket) }, 100 )



const players = require('./src/player')
const items = require('./src/items') 


players.event.on('create', function(player) {
	Object.keys( items.get() ).forEach(function(item) {
		player.inventory.add(item, items.getStack(item) , {})
	})	
})





