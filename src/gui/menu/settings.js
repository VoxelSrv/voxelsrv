import { createWindow } from '../window'


function parseBool(val) { return val === true || val === "true" }


export function createSettingsWindow(noa) {
	var menu = document.createElement('div')
	menu.style.padding = '10px'

	var nicknameInfo = document.createElement('label')
	nicknameInfo.id = 'menu_nickname_info'
	nicknameInfo.htmlFor = 'menu_nickname'
	nicknameInfo.innerHTML = 'Username'
	nicknameInfo.style.marginBottom = '5px'
	menu.appendChild(nicknameInfo)
	
	var nicknameInput = document.createElement('input')
	nicknameInput.id = 'menu_nickname'
	nicknameInput.classList.add('form-control')
	nicknameInput.classList.add('form-control-sm')
	nicknameInput.classList.add('col-md-6')

	nicknameInput.setAttribute('placeholder', localStorage.getItem('nickname') )
	nicknameInput.value = localStorage.getItem('nickname')

	menu.appendChild(nicknameInput)


	/*var stepInfo = document.createElement('label')
	stepInfo.id = 'menu_step_info'
	stepInfo.htmlFor = 'menu_step'
	stepInfo.innerHTML = 'Username'
	stepInfo.style.marginBottom = '5px'
	menu.appendChild(stepInfo)
	
	var stepInput = document.createElement('input')
	stepInput.id = 'menu_step'
	stepInput.classList.add('form-control')
	stepInput.setAttribute('placeholder', parseBool(localStorage.getItem('autostep')) )
	stepInput.checked = localStorage.getItem('autostep')
	stepInput.type = 'checkbox'

	menu.appendChild(stepInput)*/

	var window = createWindow('menu_multiplayer', 'Settings', ['800px', '500px'], menu)

	var old = window.main.onclick

	window.main.onclick = function() {
		old()
		localStorage.setItem('nickname', nicknameInput.value)
		//localStorage.setItem('autostep', stepInput.checked)


		if (noa != undefined) {

		}
	}
	
	return window.main

}
