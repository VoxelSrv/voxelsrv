import { setupInfo, setupCross } from './info'
import { setupHotbar, setupInventory } from './inventory'
import { setupChatbox } from './chat'


export function setupGuis(noa, server, socket) {
	setupInfo(noa, server)
	setupCross()
	setupHotbar(noa)
	setupInventory(noa, socket)
	setupChatbox()
}