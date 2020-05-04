/* global BABYLON */

import Engine from 'noa-engine'

import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import 'babylonjs-loaders'
var glvec3 = require("gl-vec3");
import { initBlocks, getBlockNames } from './world/blocks'
import { initItems } from './world/items'
import { initWorldGen } from './world/menager'
import './world/commands'
import { initPhysics } from './world/physics'
import { setupPlayerEntity } from './player/player'
import { setupInteractions } from './player/actions'
import { setupGUI } from './player/gui'
import { initMusic } from './player/audio'




export function initGame() {

	// Start noa engine
	var noa = new Engine({
		debug: true,
		showFPS: true,
		inverseY: false,
		inverseX: false,
		sensitivityX: 15, // Make it changeable?
		sensitivityY: 15, // ^
		chunkSize: 24, // Don't touch this
		chunkAddDistance: 5.5, // Make it changeable?
		chunkRemoveDistance: 5.0, // ^
		blockTestDistance: 10, // Per Gamemode
		tickRate: 60, // Maybe make it lower
		texturePath: 'textures/',
		playerStart: [0.5, 100, 0.5], // Make y changeable based on terrain/last player possition
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
		gravity: [0, -16, 0],
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
			"cmd" :["T"]
		}
	})

	noa.world.worldGenWhilePaused = true

	var scene = noa.rendering.getScene()

	// this registers all the blocks and materials
	game.itemdata = {}
	game.items = initItems(noa)
	game.blockdata = {}
	game.blocks = initBlocks(noa)

	var block = game.blocks
	game.blockNames = getBlockNames(game.blocks)

	// this sets up worldgen
	initWorldGen(noa)

	// adds a mesh to player
	setupPlayerEntity(noa)

	// does stuff on button presses
	setupInteractions(noa)

	// this sets up worldgen
	initPhysics(noa)

	// GUI
	setupGUI(noa)

	// Audio
	initMusic()


	window.onbeforeunload = function(){
		return 'Are you sure you want to leave (or you just tried to spint)? '
	}
	document.addEventListener('keydown', function(evt){

	// NOTE: ctrl key is sent here, but ctrl+W is not
	if (evt.ctrlKey) {
		var stopEvilCtrlW = function(e) {
			return "Oopsies, Chrome!"
			},  clearEvilCtrlW = function() {
				window.removeEventListener('beforeunload', stopEvilCtrlW, false); 
			};
			setTimeout(clearEvilCtrlW, 1000)
			window.addEventListener('beforeunload', stopEvilCtrlW, false)
		}
	}, false)
}

