import { createMultiplayerWindow } from './multiplayer';
import { createSettingsWindow } from './settings';
import { gameVersion, gameProtocol } from '../../values';

// Main menu

export function buildMain(connect) {
	var menuScreen = document.createElement('div'); // Background
	menuScreen.id = 'menu_screen';
	
	var menuContainer = document.createElement('div'); // Container
	menuContainer.id = 'menu_container';

	menuScreen.appendChild(menuContainer);

	var menuLogo = document.createElement('img'); // Logo
	menuLogo.id = 'menu_logo';
	menuLogo.src = './textures/gui/logo.png';

	menuContainer.appendChild(menuLogo);

	var warn = document.createElement('h2'); // Logo
	warn.id = 'menu_warn';
	warn.innerHTML = 'Warning! This is non-stable version which is under ongoing rewrite!<br>Many things may not work! Check our discord if you have ideas we could add!'
	warn.style = 'margin-top: 200px'
	warn.src = './textures/gui/logo.png';

	menuContainer.appendChild(warn);

	var multiplayerWindow = createMultiplayerWindow(connect); // Creates and sets multiplayerWindow
	multiplayerWindow.style.display = 'none';
	menuScreen.appendChild(multiplayerWindow);

	/*var singleplayerWindow = createSingleplayerWindow()
	singleplayerWindow.style.display = 'none'
	menuScreen.appendChild(singleplayerWindow)*/

	var settingsWindow = createSettingsWindow(); // Creates and sets settingsWindow
	settingsWindow.style.display = 'none';
	menuScreen.appendChild(settingsWindow);

	// Menu options

	var menuOptions = document.createElement('ul');
	menuOptions.id = 'menu_options';
	menuOptions.classList.add('menu_list');

	var multiplayerOption = document.createElement('li');
	multiplayerOption.innerHTML = 'Multiplayer';
	multiplayerOption.onclick = function () {
		multiplayerWindow.style.display = 'initial';
	};
	menuOptions.appendChild(multiplayerOption);

	var settingsOption = document.createElement('li');
	settingsOption.innerHTML = 'Settings';
	settingsOption.onclick = function () {
		settingsWindow.style.display = 'initial';
	};
	menuOptions.appendChild(settingsOption);

	var githubOption = document.createElement('li');
	githubOption.innerHTML = 'Github';
	githubOption.onclick = function () {
		window.open('https://github.com/VoxelSrv/voxelsrv', '_blank');
	};
	menuOptions.appendChild(githubOption);

	var discordOption = document.createElement('li');
	discordOption.innerHTML = 'Official discord';
	discordOption.onclick = function () {
		window.open('https://discord.com/invite/K9PdsDh', '_blank');
	};
	menuOptions.appendChild(discordOption);

	menuContainer.appendChild(menuOptions);

	// Version

	var menuVersion = document.createElement('div');
	menuVersion.id = 'menu_version';
	menuVersion.innerHTML = 'VoxelSrv ' + gameVersion;

	menuScreen.appendChild(menuVersion);

	document.getElementById('gui-container').appendChild(menuScreen);
}
