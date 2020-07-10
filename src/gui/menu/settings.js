import { createWindow } from '../window'


export function createSettingsWindow(noa) {
	var menu = document.createElement('div')
	menu.style.padding = '10px'

	// Nickname

	var nicknameDiv = document.createElement('div')
	nicknameDiv.classList.add('form-group')

	var nicknameInfo = document.createElement('label')
	nicknameInfo.id = 'menu_nickname_info'
	nicknameInfo.htmlFor = 'menu_nickname'
	nicknameInfo.innerHTML = 'Username'
	nicknameInfo.style.marginBottom = '5px'
	nicknameDiv.appendChild(nicknameInfo)
	
	var nicknameInput = document.createElement('input')
	nicknameInput.id = 'menu_nickname'
	nicknameInput.classList.add('form-control')
	nicknameInput.classList.add('form-control-sm')
	nicknameInput.classList.add('col-md-6')

	nicknameInput.setAttribute('placeholder', localStorage.getItem('nickname') )
	nicknameInput.value = localStorage.getItem('nickname')

	nicknameDiv.appendChild(nicknameInput)

	menu.appendChild(nicknameDiv)


	// Enable experimental singleplayer

	var singleplayerDiv = document.createElement('div')
	singleplayerDiv.classList.add('form-check')

	var singleplayerLabel = document.createElement('label')
	singleplayerLabel.id = 'menu_options_singleplayer_info'
	singleplayerLabel.classList.add('form-check-label')
	singleplayerLabel.htmlFor = 'menu_options_singleplayer'
	singleplayerLabel.innerHTML = 'Enable experimental singleplayer mode'
	
	var singleplayerInput = document.createElement('input')
	singleplayerInput.id = 'menu_options_singleplayer'
	singleplayerInput.classList.add('form-check-input')
	singleplayerInput.checked = (localStorage.getItem('singleplayer') == 'true')
	singleplayerInput.type = 'checkbox'

	singleplayerDiv.appendChild(singleplayerInput)
	singleplayerDiv.appendChild(singleplayerLabel)

	menu.appendChild(singleplayerDiv)


	// Enable autostep

	var stepDiv = document.createElement('div')
	stepDiv.classList.add('form-check')

	var stepLabel = document.createElement('label')
	stepLabel.id = 'menu_step_info'
	stepLabel.classList.add('form-check-label')
	stepLabel.htmlFor = 'menu_step'
	stepLabel.innerHTML = 'Autostep'
	
	var stepInput = document.createElement('input')
	stepInput.id = 'menu_step'
	stepInput.classList.add('form-check-input')
	stepInput.checked = (localStorage.getItem('autostep') == 'true')
	stepInput.type = 'checkbox'

	stepDiv.appendChild(stepInput)
	stepDiv.appendChild(stepLabel)

	menu.appendChild(stepDiv)


	// Enable gamepad support

	var gamepadDiv = document.createElement('div')
	gamepadDiv.classList.add('form-check')

	var gamepadLabel = document.createElement('label')
	gamepadLabel.id = 'menu_options_gamepad_label'
	gamepadLabel.classList.add('form-check-label')
	gamepadLabel.htmlFor = 'menu_options_gamepad'
	gamepadLabel.innerHTML = 'Enable gamepad support'
	
	var gamepadInput = document.createElement('input')
	gamepadInput.id = 'menu_options_gamepad'
	gamepadInput.classList.add('form-check-input')
	gamepadInput.checked = (localStorage.getItem('gamepad') == 'true')
	gamepadInput.type = 'checkbox'

	gamepadDiv.appendChild(gamepadInput)
	gamepadDiv.appendChild(gamepadLabel)

	menu.appendChild(gamepadDiv)


	var window = createWindow('menu_settins', 'Settings', ['800px', '500px'], menu)

	var old = window.main.onclick

	window.main.onclick = function() {
		old()
		localStorage.setItem('nickname', nicknameInput.value)
		localStorage.setItem('singleplayer', singleplayerInput.checked)
		localStorage.setItem('autostep', stepInput.checked)
		localStorage.setItem('gamepad', gamepadInput.checked)



		if (noa != undefined) {

		}
	}
	
	return window.main

}
