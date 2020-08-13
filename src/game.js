
const cruncher = require('voxel-crunch')

const protocol = require('./protocol')

const ndarray = require('ndarray')
var vec3 = require('gl-vec3')
const EventEmiter = require('events')

protocol

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

const engineParams = {
	debug: true,
	showFPS: true,
	inverseY: false,
	inverseX: false,
	sensitivityX: parseInt( localStorage.getItem('mouse') ),
	sensitivityY: parseInt( localStorage.getItem('mouse') ),
	chunkSize: 24, // Don't touch this
	chunkAddDistance: 5.5, // Make it changeable?
	chunkRemoveDistance: 6.0, // ^
	blockTestDistance: 7, // Per Gamemode?
	tickRate: ( isMobile ? 65 : 50 ), // Maybe make it lower
	texturePath: '',
	playerStart: [0, 100, 0],
	playerHeight: 1.85,
	playerWidth: 0.5,
	playerAutoStep: (localStorage.getItem('autostep') == 'true'),
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
		"inventory": ["E"],
		"muteMusic": ["O"],
		"thirdprsn": ["M"],
		"chatenter": ["<enter>"],
		"chat": ["T"],
		"tab": ["<tab>"],
		"menu": ["<escape>"],
		"screenshot": ["P"]

	}
}

export function startGame(username, server, world) {

	if (typeof server == 'string') {

		var socket = new WebSocket('ws://' + server)
		socket.binaryType = 'arraybuffer'

	} else {
		const fromServer = new EventEmiter()
		fromServer.emit2 = fromServer.emit

		server.onmessage = function (m) { 
			fromServer.emit2(m.data[0], m.data[1])
		}

		function emitToServer(type, packet) {
			server.postMessage([type, packet])
		}

		fromServer.emit = emitToServer

		var socket = fromServer

		fromServer.on('get-world', () => {
			emitToServer('select-world', world)
		})
	}

	console.log('Username: ' + username, 'Server: ' + server)
	var discreason

	var srvEvent = protocol.eventServer
	var clnEvent = protocol.eventClient


	function send(type, data) {
		var packet = protocol.parseToMessage('client', type, data)
		if (packet != null) {
			socket.send(packet)
			clnEvent.emit(type, data)
		}
	}

	socket.onmessage = (data) => {
		var packet = protocol.parseToObject('server',  new Uint8Array(data.data) )
		if (packet != null) srvEvent.emit(packet.type, packet.data)
	}

	srvEvent.on('loginRequest', function(dataLogin) {
		send('loginResponse', {
			username: username,
			protocol: game.protocol,
			mobile: isMobile
		})

		srvEvent.on('playerKick', function(data) {
			console.log('You has been kicked from server \nReason: ' + data.reason)
			discreason = data.reason
			return
		})

		var entityIgnore = 0
		var entityList = {}

		srvEvent.on('playerEntity', function(data) {
			console.log('Ignoring player-entity: ' + data.uuid)
			entityIgnore = data.uuid
			if (entityList[data.uuid] != undefined) noa.ents.deleteEntity(entityList[data.uuid]); delete entityList[data.uuid]
		})

		srvEvent.on('loginSuccess', function(dataPlayer) {
			document.body.innerHTML = ""

			engineParams.playerStart = [dataPlayer.xPos, dataPlayer.yPos, dataPlayer.zPos]
			var noa = new Engine(engineParams)
			var moveState = noa.inputs.state
			var lastPos = {}
			var lastRot = 0
			var chunkList = []

			registerBlocks(noa, JSON.parse(dataPlayer.blocksDef), JSON.parse(dataPlayer.blockIDsDef))
			registerItems(noa, JSON.parse(dataPlayer.itemsDef) )
			defineModelComp(noa)

			setupControls(noa, send)
			setupPlayer(noa, JSON.parse(dataPlayer.inventory) )

			setupGuis(noa, server, send, dataPlayer, dataLogin)
				
			srvEvent.on('worldChunk', function(data) {
				var chunkdata = cruncher.decode(Object.values(data.chunk), new Uint16Array(24 * 120 * 24))
				var array = new ndarray(chunkdata, [24, 120, 24])
				
				chunkList.push([data.id, array])
			})

			srvEvent.on('worldBlockUpdate', function(data) {
				noa.setBlock(data.id, [data.x, data.y, data.z])
			})

			srvEvent.on('playerInventory', function(data) {
				var inv = JSON.parse(data.inventory)
				noa.ents.getState(noa.playerEntity, 'inventory').main = inv.main
				noa.ents.getState(noa.playerEntity, 'inventory').tempslot = inv.tempslot
				updateInventory(noa)
			})

			srvEvent.on('chatMessage', function(data) { 
				addToChat(data.message)
				console.log('Chat: ' + data.message)
			})

			srvEvent.on('tabUpdate', function(data) {
				setTab(data.message)
			})

			srvEvent.on('playerTeleport', function(data) {
				noa.ents.setPosition(noa.playerEntity, [data.x, data.y, data.z])
				console.log('Teleport: ', data)
			})

			srvEvent.on('playerMovementChange', function(data) {
				var move = noa.ents.getMovement(noa.playerEntity)
				move[data.key] = data.value
			})

			srvEvent.on('entityCreate', async function(data) {
				if (entityIgnore != data.uuid) {
					entData = JSON.parse(data.data)
					entityList[data.uuid] = noa.ents.add(Object.values(entData.position), 1, 2, null, null, false, true)
					
					applyModel(entityList[data.uuid], entData.model, entData.texture, entData.offset, entData.nametag, entData.name, entData.hitbox)
									
				}
			})

			srvEvent.on('entityRemove', function(data) {
				if (entityList[data.uuid] != undefined) noa.ents.deleteEntity(entityList[data.uuid]); delete entityList[data.uuid]
			})

			srvEvent.on('entityMove', function(data) {
				if (entityList[data.uuid] != undefined) {
					var pos = [data.x, data.y, data.z]
					noa.ents.getState(entityList[data.uuid], 'position').newPosition = pos
					noa.ents.getState(entityList[data.uuid], 'position').rotation = data.rotation * 2
				}
			})

			srvEvent.on('soundPlay', function(data) { playSound(data.sound, data.volume, ( (data.x != undefined) ? [data.x, data.y, data.z] : null), noa) } )

			var pos = noa.ents.getState(noa.playerEntity, 'position').position
			send('actionMove', {x: pos[0], y: pos[1], z: pos[2], rotation: noa.camera.heading})
			var timerPos = 0

			setTimeout(function() {
				setInterval(async function() {
					if (chunkList.length != 0) {
						setChunk(chunkList[0][0], chunkList[0][1], noa)
						chunkList.shift()
					}
				}, 50)
			}, 500)

			noa.on('tick', function() {
				timerPos = timerPos + 1
				if (timerPos == 1) {
					timerPos = 0
					var pos = noa.ents.getState(noa.playerEntity, 'position').position
					var rot = noa.camera.heading
					if (JSON.stringify(lastPos) != JSON.stringify(pos) || JSON.stringify(lastRot) != JSON.stringify(rot) ) {
						lastPos = [...pos]
						lastRot = JSON.parse( JSON.stringify(rot) )

						send('actionMove', {x: pos[0], y: pos[1], z: pos[2], rotation: noa.camera.heading})
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


	socket.onclose = function() {
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
		
	}
	
}