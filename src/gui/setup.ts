import { setupDebug, setupDot, debug, dot } from './debug';
import { buildHotbar, buildInventory, inventory, hotbar } from './inventory';
import { setupHand } from './hand';
import { setupChat, chatContainer, input } from './chat';
import buildPause from './pause';

export function setupGuis(noa, socket, dataPlayer, dataLogin) {
	buildHotbar(noa, socket);
	setupDot();
	setupDebug(noa, socket.server);
	buildInventory(noa, socket);
	setupChat();
	buildPause(noa);
	//setupHand(noa);
}

export function destroyGuis() {
	if (inventory != null) inventory.dispose();
	if (hotbar != null) hotbar.dispose();
	if (chatContainer != null) chatContainer.dispose();
	if (debug != null) debug.dispose();
	if (dot != null) dot.dispose();
}
