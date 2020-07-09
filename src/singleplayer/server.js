const EventEmiter = require('events')

var version = '0.1.0'
var protocol = 1

console.log('Starting VoxelSRV server version ' + version + ' [Protocol: ' + protocol + ']\n')

var cfg = require('./config.json')


require('./src/blocks').init()
require('./src/items').init()

const fs = require('fs')
const initProtocol = require('./src/protocol').init

BrowserFS.configure({
    fs: "InMemory"
  }, function(e) {
    if (e) {
      throw e;
    }
  })

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

socket.disconnect = function() { console.log('Disconnect...') }


require('./src/world/main').init(cfg.world)

initProtocol(io)

if (!fs.existsSync('./plugins') ) fs.mkdirSync('./plugins')
if (!fs.existsSync('./players') ) fs.mkdirSync('./players')
if (!fs.existsSync('./world') ) fs.mkdirSync('./world')
if (!fs.existsSync('./world/chunks') ) fs.mkdirSync('./world/chunks')

io.emit2('connection', socket)


const players = require('./src/player')
const items = require('./src/items')


players.event.on('create', function(player) {
	Object.keys( items.get() ).forEach(function(item) {
		player.inventory.add(item, items.getStack(item) , {})
	})	
})





