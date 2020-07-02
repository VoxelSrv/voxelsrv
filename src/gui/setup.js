import { setupInfo, setupCross } from './info'
import { setupHotbar, setupInventory } from './inventory'
import { setupChatbox } from './chat'
import { setupHand } from './hand'
import { setupTab } from './tab'
import { setupSkybox, setupClouds } from './skybox'


export function setupGuis(noa, server, socket, dataPlayer, dataLogin) {
	setupInfo(noa, server, dataLogin)
	setupCross()
	setupHotbar(noa)
	setupInventory(noa, socket)
	setupChatbox()
	setupTab()
	setupClouds(noa)
	//setupSkybox(noa)
	//setupHand(noa)
}