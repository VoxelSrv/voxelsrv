const md = require('markdown-it')()


var chatbox
var input
var socket

export function setupChatbox() {
	chatbox = document.createElement('div')
	chatbox.id = 'game_chatbox'
	chatbox.classList.add('col-3')

	input = document.createElement('input')
	input.id = 'game_chatinput'
	input.classList.add('col-3')


	document.body.appendChild(input)
	document.body.appendChild(chatbox)
}


export function addToChat(text) {
	var msg = document.createElement('div')
	msg.classList.add('chat_line')
	text = text.replace('<', '&lt;')
	text = text.replace('>', '&gt;')
	msg.innerHTML = md.render(text)
	chatbox.appendChild(msg)
}

export function sendFromInput(socket) {
	var msg = input.value
	socket.emit('chat-send', msg)

	input.value = ""
}