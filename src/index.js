import { initGame } from './game'

global.game = {}
game.name = 'VoxelSrv'
game.version = '0.0.9'

// Worldname
game.world = 'temp'


game.seed = Math.random()//2020123457631245453

// Players gamemode 0 - Survival, 1 - Creative
game.mode = 1

initGame()
