import { setupInfo, setupCross } from './info'
import { setupHotbar, setupInventory } from './inventory'
import { setupChatbox } from './chat'
import { setupHand } from './hand'
import { setupTab } from './tab'
import { setupSkybox } from './skybox'


export function setupGuis(noa, server, socket, dataPlayer, dataLogin) {
	setupInfo(noa, server, dataLogin)
	setupCross()
	setupHotbar(noa)
	setupInventory(noa, socket)
	setupChatbox()
	setupTab()
	//setupSkybox(noa)
	//setupHand(noa)
}