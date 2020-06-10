const md = new require('markdown-it')({
	html: false,
	linkify: false,
	breaks: false,
	typographer: true
}).disable([ 'link' ])


var chatbox
var input
var socket

export function setupChatbox() {
	chatbox = document.createElement('div')
	chatbox.id = 'game_chatbox'
	chatbox.classList.add('col-5')

	input = document.createElement('input')
	input.id = 'game_chatinput'
	input.classList.add('col-5')
	input.style.display = 'none'


	document.body.appendChild(input)
	document.body.appendChild(chatbox)
}


export function addToChat(text) {
	var msg = document.createElement('div')
	msg.classList.add('chat_line')
	text = text.replace('<', '&lt;')
	text = text.replace('>', '&gt;')
	msg.innerHTML = md.render(text)
	chatbox.insertBefore(msg, chatbox.firstElementChild)
}

export function sendFromInput(socket) {
	var msg = input.value
	socket.emit('chat-send', msg)

	input.value = ""
}