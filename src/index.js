import { initGame } from './game'

global.game = {}
game.name = 'VoxelSrv'
game.version = '0.0.8'

// Worldname
game.world = 'temp'


game.seed = 2020123457631245453

// Players gamemode 0 - Survival, 1 - Creative
game.mode = 1

initGame()
