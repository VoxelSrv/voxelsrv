import { setupInfo, setupCross } from './info'
import { setupHotbar, setupInventory } from './inventory'
import { setupChatbox } from './chat'
import { setupHand } from './hand'
import { setupTab } from './tab'
import { setupSkybox, setupClouds } from './skybox'
import { isMobile } from 'mobile-device-detect'
import { setupMobile } from './mobile'
import { setupPause } from './pause'


export function setupGuis(noa, server, socket, dataPlayer, dataLogin) {
	//setupHotbar(noa, socket)
	setupInventory(noa, socket.send)
	setupChatbox(noa)
	setupTab()
	setupClouds(noa)
	setupPause(noa)
	//setupSkybox(noa)
	//setupHand(noa)

	if ( isMobile ) setupMobile(noa)
}