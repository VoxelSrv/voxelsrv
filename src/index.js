const options = new URLSearchParams(window.location.search)

var server = options.get('ip')

var username = options.get('username')

var discreason

console.log('Username: ' + username, 'Server: ' + server)

global.game = {
	name: 'VoxelSRV',
	version: '0.1.7-dev',
	allowCustom: true
}
const io = require('socket.io-client')
const cruncher = require('voxel-crunch')
const ndarray = require('ndarray')
var vec3 = require('gl-vec3')

const socket = new io('ws://' + server, {
	reconnection: false
})

import Engine from 'noa-engine'
import { isMobile } from 'mobile-device-detect'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import 'babylonjs-loaders'
import { registerBlocks, registerItems } from './registry'
import { setupGuis } from './gui/setup'
import { updateInventory } from './gui/inventory'
import { setTab } from './gui/tab'
import { setChunk } from './world'
import { setupPlayer, setupControls } from './player'
import { addToChat, parseText } from './gui/chat'
import { playSound } from './sound'
import { applyModel, defineModelComp } from './model'

if (isMobile) {
	var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'mobile.css'
	document.head.appendChild(link)
	document.documentElement.addEventListener('click', function() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen()
		}
	})
}

const engineParams = {
	debug: true,
	showFPS: true,
	inverseY: false,
	inverseX: false,
	sensitivityX: ( isMobile ? 50 : 15 ), // Make it changeable?
	sensitivityY: ( isMobile ? 50 : 15 ), // ^
	chunkSize: 24, // Don't touch this
	chunkAddDistance: 5.5, // Make it changeable?
	chunkRemoveDistance: 6.0, // ^
	blockTestDistance: 7, // Per Gamemode?
	tickRate: 60, // Maybe make it lower
	texturePath: '',
	playerStart: [0, 100, 0], // Make y changeable based on terrain/last player possition
	playerHeight: 1.85,
	playerWidth: 0.5,
	playerAutoStep: isMobile, // true for mobile?
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
		"cmd": ["<enter>"],
		"chat": ["T"],
		"tab": ["<tab>"]
	}
}


socket.on('login-request', function(dataLogin) {
	socket.emit('login', {
		username: username,
		protocol: 1,
		mobile: isMobile
	})

	socket.on('kick', function(data) {
		console.log('You has been kicked from server \nReason: ' + data)
		discreason = data
		return
	})

	var entityIgnore = 0
	var entityList = {}

	socket.on('entity-ignore', function(data) {
		console.log('Ignoring player-entity: ' + data)
		entityIgnore = data
		if (entityList[data] != undefined) noa.ents.deleteEntity(entityList[data]); delete entityList[data]
	})

	socket.on('login-success', function(dataPlayer) {
		document.body.innerHTML = ""

		if (dataPlayer.pos != undefined) engineParams.playerStart = dataPlayer.pos
		var noa = new Engine(engineParams)
		var moveState = noa.inputs.state
		var lastPos = {}
		var lastRot = 0
		var chunkList = []

		registerBlocks(noa, dataPlayer.blocks, dataPlayer.blockIDs)
		registerItems(noa, dataPlayer.items)
		defineModelComp(noa)

		setupControls(noa, socket)
		setupPlayer(noa, dataPlayer.inv)

		setupGuis(noa, server, socket, dataPlayer, dataLogin)
		
		socket.on('chunkdata', function(data) {
			var chunkdata = cruncher.decode(Object.values(data.chunk), new Uint16Array(24 * 120 * 24))
			var array = new ndarray(chunkdata, [24, 120, 24])
			
			chunkList.push([data.id, array])
		})

		socket.on('block-update', function(data) {
			noa.setBlock(data.id, data.pos)
		})

		socket.on('inventory-update', function(data) {
			noa.ents.getState(noa.playerEntity, 'inventory').main = data.main
			noa.ents.getState(noa.playerEntity, 'inventory').tempslot = data.tempslot
			updateInventory(noa)
		})

		socket.on('chat', function(data) { 
			addToChat(data)
			console.log('Chat: ' + data)
		})

		socket.on('tab-update', function(data) {
			setTab(data)
		})

		socket.on('teleport', function(data) {
			noa.ents.setPosition(noa.playerEntity, data)
			console.log('Teleport: ', data)
		})

		socket.on('movement-change', function(data) {
			var move = noa.ents.getMovement(noa.playerEntity)
			move = data
		})

		socket.on('skybox-colors', function(data) {
			
		})

		socket.on('entity-spawn', async function(data) {
			if (entityIgnore != data.id) {
				entityList[data.id] = noa.ents.add(Object.values(data.data.position), 1, 2, null, null, false, true)

				applyModel(entityList[data.id], data.data.model, data.data.texture, data.data.offset, data.data.nametag, data.data.name)
								
			}
		})

		/*socket.on('entity-update', function(data) {
			if (data.index == '')
			noa.ents.getState()
		})*/

		socket.on('entity-despawn', function(data) {
			if (entityList[data] != undefined) noa.ents.deleteEntity(entityList[data]); delete entityList[data]

		})

		socket.on('entity-move', function(data) {
			if (entityList[data.id] != undefined) {
				var pos = Object.values(data.data.pos)
				noa.ents.getState(entityList[data.id], 'position').newPosition = data.data.pos
				noa.ents.getState(entityList[data.id], 'position').rotation = data.data.rot * 2
			}
		})

		socket.on('sound-play', function(data) { playSound(data.sound, data.volume, data.position, noa) } )


		socket.emit('move', {pos: noa.ents.getState(noa.playerEntity, 'position').position, rot: noa.camera.heading})
		var timerPos = 0

		setInterval(async function() {
			if (chunkList.length != 0) {
				setChunk(chunkList[0][0], chunkList[0][1], noa)
				chunkList.shift()
			}
		}, 50)
		noa.on('tick', function() {
			timerPos = timerPos + 1
			if (timerPos == 1) {
				timerPos = 0
				var pos = noa.ents.getState(noa.playerEntity, 'position').position
				var rot = noa.camera.heading
				if (JSON.stringify(lastPos) != JSON.stringify(pos) || JSON.stringify(lastRot) != JSON.stringify(rot) ) {
					lastPos = [...pos]
					lastRot = JSON.parse( JSON.stringify(rot) )

					socket.emit('move', {pos: pos, rot: rot})
				}
			}

		})
		noa.on('beforeRender', async function() {
			Object.values(entityList).forEach(async function (id) {
				var pos = noa.ents.getState(id, 'position').position
				var newPos = noa.ents.getState(id, 'position').newPosition
				if (noa.ents.getState(id, noa.entities.names.mesh) != undefined && newPos != undefined && pos != undefined) {
					var move = vec3.create()	
					vec3.lerp(move, pos, newPos, 0.1)			
					var rot = noa.ents.getState(id, 'position').rotation
					noa.ents.setPosition(id, move)

					var oldRot = noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y

					if (rot/2 - oldRot > 5) noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y = rot/2
					else noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y = (rot/2 + oldRot)/2
					
					

					if (noa.ents.getState(id, 'model').nametag != undefined) {
						noa.ents.getState(id, 'model').nametag.rotation.y = noa.camera.heading - noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y
						noa.ents.getState(id, 'model').nametag.rotation.x = noa.camera.pitch

					}
				}
			})
		})

	})
})

socket.once('disconnect', function() {
	document.body.innerHTML = '' 
	var div = document.createElement('div')
	var style = 'position:fixed; bottom:50%; left:50%; z-index:2;'
	style += 'color:white; height:auto; width:auto; text-shadow: 1px 1px #000000;'
	style += 'font-size:20px; padding:3px; text-aling:center;'
	style += 'min-width:2em; transform: translate(-50%, 50%);'

	div.style = style
	
	var h3 = document.createElement('h3')
	h3.innerText = "Disconnected!"

	var reason = document.createElement('div')

	if (discreason != undefined) reason.innerHTML = parseText(discreason)
	else reason.innerHTML = 'Connection has been closed'

	div.appendChild(h3)
	div.appendChild(reason)

	document.body.appendChild(div)
	
} )