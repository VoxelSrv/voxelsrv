import { createSettingsWindow } from './menu/settings'

var menuScreen = null

export function setupPause(noa) {
	menuScreen = document.createElement('div') // Background
	menuScreen.id = 'menu_pause'
	menuScreen.style.display = 'none'

	var menuContainer = document.createElement('div') // Container
	menuContainer.id = 'menu_container_pause'

	menuScreen.appendChild(menuContainer)

	var settingsWindow = createSettingsWindow(noa) // Creates and sets settingsWindow
	settingsWindow.style.display = 'none'
	menuScreen.appendChild(settingsWindow)

	// Menu options

	var menuOptions = document.createElement('ul')
	menuOptions.id = 'menu_options'
	menuOptions.classList.add('menu_list')

	var playOption = document.createElement('li')
	playOption.innerHTML = 'Back to game'
	playOption.onclick = function() { 
		menuScreen.style.display = 'none'
		noa.container.canvas.requestPointerLock()
	}
	menuOptions.appendChild(playOption)

	var settingsOption = document.createElement('li')
	settingsOption.innerHTML = 'Settings'
	settingsOption.onclick = function() { settingsWindow.style.display = 'initial'}
	menuOptions.appendChild(settingsOption)

	var discordOption = document.createElement('li')
	discordOption.innerHTML = 'Official discord'
	discordOption.onclick = function() { window.open('https://discord.com/invite/K9PdsDh', '_blank') }
	menuOptions.appendChild(discordOption)

	var leaveOption = document.createElement('li')
	leaveOption.innerHTML = 'Quit to menu'
	leaveOption.onclick = function() { 
		location.reload()
	}
	menuOptions.appendChild(leaveOption)

	menuContainer.appendChild(menuOptions)

	body.appendChild(menuScreen)
}
