import { setupInfo, setupCross } from './info'
import { setupHotbar, setupInventory } from './inventory'
import { setupChatbox } from './chat'
import { setupHand } from './hand'
import { setupTab } from './tab'


export function setupGuis(noa, server, socket, dataPlayer, dataLogin) {
	setupInfo(noa, server, dataLogin)
	setupCross()
	setupHotbar()
	setupInventory(noa, socket)
	setupChatbox()
	setupTab()
	//setupHand(noa)
}