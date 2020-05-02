import { initGame } from './game'

global.game = {}
game.name = 'VoxelSrv'
game.version = '0.0.5'

// Worldname
game.world = 'temp'

// Used in worldgen
game.seed = (new Date()).getTime()/1000 //123

// Players gamemode 0 - Survival, 1 - Creative
game.mode = 1

initGame()
