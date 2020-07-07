import { startGame } from './game'
import { isMobile } from 'mobile-device-detect'
import { createWindow } from './gui/window'


global.game = {
	name: 'VoxelSRV',
	version: '0.1.8-dev',
	allowCustom: true
}

var menuScreen = document.createElement('div')
menuScreen.id = 'menu_screen'
menuScreen.style['background-image'] = 'url(./textures/menu.jpg)'

var menuContainer = document.createElement('div')
menuContainer.id = 'menu_container'

menuScreen.appendChild(menuContainer)


var menuLogo = document.createElement('img')
menuLogo.id = 'menu_logo'
menuLogo.src = './textures/gui/logo.png'

menuContainer.appendChild(menuLogo)


var multiplayerMenu = document.createElement('div')
multiplayerMenu.style.padding = '10px'

var nicknameInput = document.createElement('input')
nicknameInput.id = 'menu_nickname'
nicknameInput.classList.add('form-control-lg')
nicknameInput.setAttribute('required', '');
nicknameInput.setAttribute('placeholder', "Username");

multiplayerMenu.appendChild(nicknameInput)


var serverInput = document.createElement('input')
serverInput.id = 'menu_server'
serverInput.classList.add('form-control-lg')
serverInput.setAttribute('required', '');
serverInput.setAttribute('placeholder', "Server");

multiplayerMenu.appendChild(serverInput)

var connectButton = document.createElement('button')
connectButton.id = 'menu_connect'
connectButton.classList.add('btn')
connectButton.classList.add('btn-primary')
connectButton.classList.add('btn-lg')
connectButton.onclick = function() {
	var nick = nicknameInput.value
	var server = serverInput.value
	console.log(nick, server)

	startGame(nick, server, true)
}

connectButton.innerHTML = 'Join'

multiplayerMenu.appendChild(connectButton)

var serverList = document.createElement('table')

serverList.setAttribute('class', "col-md-8 table table-bordered table-sm")

var serverListHead = document.createElement('thead')
serverListHead.classList.add('thead-dark')
serverListHead.innerHTML =`
	<tr>
		<th scope="col">Address</th>
		<th scope="col">Name</th>
		<th scope="col">Motd</th>
		<th scope="col"></th>
	</tr>
	`
serverList.appendChild(serverListHead)
multiplayerMenu.appendChild(serverList)

var serverListBody = document.createElement('tbody')
serverListBody.classList.add('table-hover')
serverList.appendChild(serverListBody)




var multiplayerWindow = createWindow('menu_multiplayer', 'Multiplayer servers', ['50vw', '50vh'], multiplayerMenu)
multiplayerWindow.main.style.display = 'none' 

menuScreen.appendChild(multiplayerWindow.main)


var menuOptions = document.createElement('ul')
menuOptions.id = 'menu_options'
menuOptions.classList.add('menu_list')

var multiplayerOption = document.createElement('li')
multiplayerOption.innerHTML = 'Multiplayer'
multiplayerOption.onclick = function() { multiplayerWindow.main.style.display = 'initial'}
menuOptions.appendChild(multiplayerOption)

var githubOption = document.createElement('li')
githubOption.innerHTML = 'Github'
githubOption.onclick = function() { window.open('https://github.com/Patbox/voxelsrv', '_blank') }
menuOptions.appendChild(githubOption)

var discordOption = document.createElement('li')
discordOption.innerHTML = 'Official discord'
discordOption.onclick = function() { window.open('https://discord.com/invite/K9PdsDh', '_blank') }
menuOptions.appendChild(discordOption)


menuContainer.appendChild(menuOptions)


var menuVersion = document.createElement('div')
menuVersion.id = 'menu_version'
menuVersion.innerHTML = game.name + ' ' + game.version

menuScreen.appendChild(menuVersion)

if (isMobile) {
	var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'mobile.css'
	document.head.appendChild(link)
	document.documentElement.addEventListener('click', function() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen()
		}
	})
}


window.onload = function() { document.body.appendChild(menuScreen) }


setTimeout(function() {
	fetch('http://pb4.eu:9000').then(response => response.json())
		.then(function(data) {
			var x = 0
			var array = Object.values(data)
			array.forEach( function(item) {
				var row = serverListBody.insertRow(x)
				x = x + 1

                var cell1 = row.insertCell(0)
                var cell2 = row.insertCell(1)
				var cell3 = row.insertCell(2)
				var cell4 = row.insertCell(3)


                cell1.innerHTML = item.ip
                cell2.innerHTML = item.name
				cell3.innerHTML = item.motd

				var button = document.createElement('button')
				button.innerHTML = 'Select'
				button.classList.add("btn")
				button.classList.add("btn-outline-secondary")
				button.classList.add("btn-sm")
				cell4.appendChild(button)
				button.onclick = function(){ serverInput.value = item.ip }

			})
			
		})
})