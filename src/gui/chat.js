const md = new require('markdown-it')({
	html: false,
	linkify: true,
	breaks: false,
	typographer: true
})

var defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
	return self.renderToken(tokens, idx, options);
  };
  
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
	// If you are sure other plugins can't add `target` - drop check below
	var aIndex = tokens[idx].attrIndex('target');
  
	if (aIndex < 0) {
	  tokens[idx].attrPush(['target', '_blank']); // add new attribute
	} else {
	  tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
	}
  
	// pass token to default renderer.
	return defaultRender(tokens, idx, options, env, self);
  };

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