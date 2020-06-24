import { parseText } from './chat'

var tabScreen


export function setupTab() { 
	tabScreen = document.createElement('div')
	tabScreen.classList.add('tab_screen')
	tabScreen.id = 'game_tab'


	tabScreen.style.display = 'none'

	document.body.appendChild(tabScreen)
}



export async function setTab(text) {
	tabScreen.innerHTML = parseText(text)

}