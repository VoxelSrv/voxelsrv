const EventEmiter = require('events')
const event = new EventEmiter()

module.exports = {
	send(id, msg) { sendMessage(id, msg) },
	sendAll(msg) { sendMessage(-2, msg) },
	event: event
}

const protocol = require('./protocol')

function sendMessage(id, msg) {
	if (id == -1) console.log(msg)
	else if (id <= -2) {
		protocol.sendAll('chat', msg)
		console.log(msg)
	}
	else protocol.send(id, 'chat', msg)
	event.emit('message', {id: id, msg: msg})
}


