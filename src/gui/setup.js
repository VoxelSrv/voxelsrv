import { setupInfo, setupCross } from './info'
import { setupHotbar, setupInventory } from './inventory'
import { setupChatbox } from './chat'
import { setupHand } from './hand'


export function setupGuis(noa, server, socket, data) {
	setupInfo(noa, server)
	setupCross()
	setupHotbar()
	setupInventory(noa, socket)
	setupChatbox()
	//setupHand(noa)
}