
window.executeCommand=function(command) {
	var arg = command.split(' ')
	arg.shift()
	if (command.startsWith('setblock')) setBlock([parseInt(arg[0], 10), parseInt(arg[1], 10), parseInt(arg[2], 10)], parseInt(arg[3], 10))
	else if (command.startsWith('tp')) teleport([parseInt(arg[0], 10), parseInt(arg[1], 10), parseInt(arg[2], 10)])
}



function setBlock(block, id) {
	console.log('Block ' + block[0] + ' ' + block[1] + ' ' + block[2] + ' has been set to ' + game.blockNames[id])
	noa.setBlock(id, block[0], block[1], block[2])
}

function teleport(loc) {
	noa.entities.setPosition(1, [loc[0], loc[1], loc[2]])
}
