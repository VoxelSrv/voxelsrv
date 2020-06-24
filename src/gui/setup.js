import { setupInfo, setupCross } from './info'
import { setupHotbar, setupInventory } from './inventory'
import { setupChatbox } from './chat'
import { setupHand } from './hand'
import { setupTab } from './tab'


export function setupGuis(noa, server, socket, data) {
	setupInfo(noa, server)
	setupCross()
	setupHotbar()
	setupInventory(noa, socket)
	setupChatbox()
	setupTab()
	//setupHand(noa)
}