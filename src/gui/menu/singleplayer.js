import singleplayer from 'worker-loader!../../singleplayer/server.js'
import { createWindow } from '../window'
import { startGame } from '../../game'


export function createSingleplayerWindow() {
	var menu = document.createElement('div')
	menu.style.padding = '10px'

	var connectButton = document.createElement('button')
	connectButton.id = 'menu_connect'
	connectButton.classList.add('btn')
	connectButton.classList.add('btn-secondary')
	connectButton.classList.add('btn-lg')

	connectButton.innerHTML = 'Test'
	connectButton.onclick = function() {
		var nick = localStorage.getItem('nickname')
		startGame(nick, new singleplayer(), 'Test')
	}

	menu.appendChild(connectButton)

	var menuWindow = createWindow('menu_singleplayer', 'Singleplayer worlds', ['800px', '500px'], menu)
	

	return menuWindow.main

}

