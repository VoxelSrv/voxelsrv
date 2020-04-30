/* global BABYLON */

import Engine from 'noa-engine'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import 'babylonjs-loaders'
import { initRegistration, getBlockNames } from './registration'
import { initWorldGen } from './world/menager'
import './world/commands'
import { initPhysics } from './world/physics'
import { setupPlayerEntity } from './player/player'
import { setupInteractions } from './player/actions'
import { setupGUI } from './player/gui'
import { initMusic } from './player/audio'



export function initGame() {

	// create engine
	var noa = new Engine({
		debug: true,
		showFPS: true,
		inverseY: false,
		inverseX: false,
		sensitivityX: 15,
		sensitivityY: 15,
		chunkSize: 16,
		chunkAddDistance: 5.5,
		chunkRemoveDistance: 5.0,
		blockTestDistance: 10,
		tickRate: 60,
		texturePath: 'textures/',
		playerStart: [0.5, 40, 0.5],
		playerHeight: 1.85,
		playerWidth: 0.5,
		playerAutoStep: false,
		clearColor: [0.8, 0.9, 1],
		ambientColor: [1, 1, 1],
		lightDiffuse: [1, 1, 1],
		lightSpecular: [1, 1, 1],
		groundLightColor: [0.5, 0.5, 0.5],
		useAO: true,
		AOmultipliers: [0.93, 0.8, 0.5],
		reverseAOmultiplier: 1.0,
		preserveDrawingBuffer: true,
		gravity: [0, -16, 0]
	})
	noa.setMaxListeners(100)

	var scene = noa.rendering.getScene()

	// this registers all the blocks and materials
	game.blockdata = {}
	game.blocks = initRegistration(noa)
	var block = game.blocks
	game.blockNames = getBlockNames(game.blocks)

	game.illegalBlocks = [block.water, block.barrier]
	game.unbreakableBlocks = [block.barrier]
	game.plantsBlocks = [block.red_flower, block.yellow_flower, block.grass_plant]

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


}

