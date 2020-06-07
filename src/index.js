const options = new URLSearchParams(window.location.search)

var server = options.get('ip')
var username = options.get('username')

global.game = {
	name: 'VoxelSRV',
	version: '0.1.0'
}

const socket = new require('socket.io-client')(server)
const cruncher = require('voxel-crunch')
const ndarray = require('ndarray')


import Engine from 'noa-engine'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { registerBlocks, registerItems } from './registry'
import { setupGuis } from './gui/setup'
import { updateInventory } from './gui/inventory'
import { setChunk } from './world'
import { setupPlayer, setupControls } from './player'
import { addToChat } from './gui/chat'

const engineParams = {
	debug: true,
	showFPS: true,
	inverseY: false,
	inverseX: false,
	sensitivityX: 15, // Make it changeable?
	sensitivityY: 15, // ^
	chunkSize: 24, // Don't touch this
	chunkAddDistance: 5.5, // Make it changeable?
	chunkRemoveDistance: 6.0, // ^
	blockTestDistance: 8, // Per Gamemode?
	tickRate: 50, // Maybe make it lower
	texturePath: 'textures/',
	playerStart: [-18, 100, -105], // Make y changeable based on terrain/last player possition
	playerHeight: 1.85,
	playerWidth: 0.5,
	playerAutoStep: false, // true for mobile?
	clearColor: [0.8, 0.9, 1],
	ambientColor: [1, 1, 1],
	lightDiffuse: [1, 1, 1],
	lightSpecular: [1, 1, 1],
	groundLightColor: [0.5, 0.5, 0.5],
	useAO: true,
	AOmultipliers: [0.93, 0.8, 0.5],
	reverseAOmultiplier: 1.0,
	preserveDrawingBuffer: true,
	gravity: [0, -14, 0],
	bindings: {
		"forward": ["W"],
		"left": ["A"],
		"backward": ["S"],
		"right": ["D"],
		"fire": "<mouse 1>",
		"mid-fire": ["<mouse 2>"],
		"alt-fire": ["<mouse 3>"],
		"jump": "<space>",
		"inventory": ["E", "I"],
		"pause": ["P"],
		"muteMusic": ["O"],
		"thirdprsn": ["M"],
		"cmd" :["<enter>"],
		"chat" :["T"]
	}
}


socket.on('login-request', function(dataLogin) {
	socket.emit('login', {
		username: username,
		protocol: 1
	})

	socket.on('kick', function(data) {
		console.log('You has been kicked from server \nReason: ' + data)
		return
	})

	socket.on('login-success', function() {
		var noa = new Engine(engineParams)
		var moveState = noa.inputs.state

		registerBlocks(noa, dataLogin.blocks, dataLogin.blockIDs)
		registerItems(noa, dataLogin.items)

		setupControls(noa, socket)
		setupPlayer(noa)

		setupGuis(noa, server, socket)
		
		socket.on('chunkdata', function(data) {
			var chunkdata = cruncher.decode(Object.values(data.chunk), new Uint16Array(24 * 120 * 24))
			var array = new ndarray(chunkdata, [24, 120, 24])
			setChunk(data.id, array, noa)
		})

		socket.on('block-update', function(data) {
			noa.setBlock(data.id, data.pos)
		})

		socket.on('inventory-update', function(data) {
			noa.ents.getState(noa.playerEntity, 'inventory').main = data.main
			noa.ents.getState(noa.playerEntity, 'inventory').tempslot = data.tempslot
			updateInventory()
		})

		socket.on('chat', function(data) { 
			addToChat(data)
			console.log('Chat: ' + data)
		} )

		socket.emit('move', noa.ents.getState(noa.playerEntity, 'position').position)

		noa.on('tick', function() {
			if (moveState['forward'] || moveState['backward'] || moveState['left'] || moveState['right']) {
				socket.emit('move', noa.ents.getState(noa.playerEntity, 'position').position)
			}
		})

	})
})

