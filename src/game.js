/* global BABYLON */

import Engine from 'noa-engine'

import { initBlocks, getBlockNames } from './world/blocks'
import { initItems } from './world/items'
import { initBlockBreak } from './player/block-break'
import { setupPlayerEntity } from './player/player'
import { setupInteractions } from './player/actions'
import { setupGUI } from './player/gui'
import { initMusic } from './player/audio'

import { initProtocol } from './protocol/main'

import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import 'babylonjs-loaders'
var glvec3 = require("gl-vec3");
var ndarray = require('ndarray')

var emptyChunk = new ndarray(new Uint16Array(24 * 24 * 24), [24, 24, 24])

for(var x = 0; x < 24; x++) {
	for(var y = 0; y < 24; y++) {
		for(var z = 0; z < 24; z++) {
			emptyChunk.set(x, y, z, 0)
		}
	}
}

global.game = {}
global.chunkList = []

export function initGame(game2) {
	game = game2

	// Start noa engine
	global.noa = new Engine({
		debug: true,
		showFPS: true,
		inverseY: false,
		inverseX: false,
		sensitivityX: 15, // Make it changeable?
		sensitivityY: 15, // ^
		chunkSize: 24, // Don't touch this
		chunkAddDistance: 6.5, // Make it changeable?
		chunkRemoveDistance: 6.0, // ^
		blockTestDistance: 8, // Per Gamemode?
		tickRate: 60, // Maybe make it lower
		texturePath: 'textures/',
		playerStart: [12, 50, 12], // Make y changeable based on terrain/last player possition
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
	})

	noa.world.worldGenWhilePaused = true

	var scene = noa.rendering.getScene()

	initBlocks(noa)
	initItems(noa)

	global.socket = new require('socket.io-client')(game.server)
	initProtocol(game, socket, noa)

	// init blockbreaking
	initBlockBreak(noa)
	
	// adds a mesh to player
	setupPlayerEntity(noa)
	
	// GUI
	setupGUI(noa)
	
	// does stuff on button presses
	setupInteractions(noa)
	
	
	// Audio
	initMusic()

}

