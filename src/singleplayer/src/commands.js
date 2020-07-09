const chat = require('./chat')
const EventEmiter = require('events')
const event = new EventEmiter()

var commands = {}


function executeCommand(id, args) {
	var arg = args.split(' ')
	var command = arg[0]
	arg.shift()
	event.emit(arg[0], {executor: id, arg: arg})

	var commandList = Object.entries(commands)

	for (var cmd of commandList) {
		if (cmd[0] == command) {
			try { commands[command].execute(id, arg) }
			catch(e) {
				console.error('User ' + id + ' tried to execute command ' + command + ' and it failed!', e)
				chat.send(id, '{color:red}An error occurred during the execution of this command!{color}')
			}
			return
		}
	}
	chat.send(id, '{color:red}This command doesn\'t exist! Check /help for list of available commands.{color}')

}

function registerCommand(command, func, description) {
	commands[command] = {execute: func, desc: description}
}


async function helpCommand(id, arg) {
	chat.send(id, '**List of all commands:**')
	Object.entries(commands).forEach(function(item) {
		chat.send(id, item[0] + ' - ' + item[1].desc)
	})
}

registerCommand('/help', helpCommand, 'Displays list of all commands')

async function helpCommand(id, arg) {
	chat.send(id, '**List of all commands:**')
	Object.entries(commands).forEach(function(item) {
		chat.send(id, item[0] + ' - ' + item[1].desc)
	})
	
}

module.exports = {
	execute: executeCommand,
	register: registerCommand,
	event: event
}