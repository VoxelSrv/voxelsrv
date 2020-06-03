import { inventoryAdd, inventorySet, getInventory, inventoryRemove} from '../player/player'
import { getItemMaxStack } from './items'

// Command executor. Can be used in console
window.executeCommand=function(command) {
	var arg = command.split(' ')
	arg.shift()
	if (command.startsWith('setblock ')) return setBlock([parseInt(arg[0], 10), parseInt(arg[1], 10), parseInt(arg[2], 10)], parseInt(arg[3], 10))
	else if (command.startsWith('tp ')) return teleport([parseInt(arg[0], 10), parseInt(arg[1], 10), parseInt(arg[2], 10)])
	else if (command.startsWith('getInventory')) return getInventory(1)
	else if (command.startsWith('giveall')) return giveall()
	else if (command.startsWith('clearinv')) return clearinv()
	else if (command.startsWith('give ')) return (inventoryAdd(1, arg[0], parseInt(arg[1]), arg[2])) ? "Item added to player's inventory!" : "Can't add item to player"
	return "This command doesn't exist!"
}


// Set block [x, y, z] to block with id id
function setBlock(block, id) {
	noa.setBlock(id, block[0], block[1], block[2])
	return 'Block ' + block[0] + ' ' + block[1] + ' ' + block[2] + ' has been set to ' + game.blockNames[id]
}

// Teleports player
function teleport(loc) {
	noa.entities.setPosition(1, [loc[0], loc[1], loc[2]])
	return 'Teleported player to ' + loc[0] + ' ' + loc[1] + ' ' + loc[2]
}

// Gives all items to player
function giveall() {
	var items = Object.values(game.items)
	items.forEach(exec) 
	function exec(item) { inventoryAdd(1, item, getItemMaxStack(item)) }
	return 'Gived items to player!'
}

// Clears inventory
function clearinv() {
	var items = Object.values(game.items)
	items.forEach(exec)

	return "Cleared player's inventory"

	function exec(item) {inventoryRemove(1, item, 9999)}
}

// Opens command prompt
export function openCommandPrompt() {
	var command = prompt('Send command')
	var output = executeCommand(command)

	var infobox = document.createElement('cmdout')
	infobox.id = 'game_commandout'
	var style = 'position:block; z-index:10;'
	infobox.style = style
	infobox.classList.add('chat_text')
	infobox.innerHTML = output + '<br>'
	var e = document.getElementById('game_chatbox')
	e.appendChild(infobox)
	setTimeout(function(){
		e.removeChild(document.getElementsByClassName("chat_text")[0]); 
	}, 10000);
	

}
