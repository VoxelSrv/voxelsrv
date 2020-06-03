import { initGame } from './game'

var game = {}
game.name = 'VoxelSrv'
game.version = '0.0.11-MP-test'

// Worldname
game.world = 'temp'


game.seed = Math.random()//2020123457631245453

// Players gamemode 0 - Survival, 1 - Creative
game.mode = 1

game.username = 'Test' + Math.round(Math.random()*10000)
game.server = 'localhost:3000'

console.log(game)
initGame(game)


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