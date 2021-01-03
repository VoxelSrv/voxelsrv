import { setupDebug, setupDot, debug, dot } from './ingame/debug';
import { inventory } from './ingame/inventory/main';
import { setupChat, chatContainer, input } from './ingame/chat';
import buildPause from './menu/pause';
import { setupTab, tabContainer } from './tab';
import { pauseScreen } from './menu/pause';
import { buildHotbar, hotbar } from './ingame/hotbar';
import { craftingInventory } from './ingame/inventory/crafting';

export function setupGuis(noa, socket, dataPlayer, dataLogin) {
	buildHotbar(noa, socket);
	setupDot();
	setupDebug(noa, socket.server);
	setupChat();
	buildPause(noa);
	setupTab();
	//setupHand(noa);
}

export function destroyGuis() {
	if (inventory != null) inventory.dispose();
	if (craftingInventory != null) craftingInventory.dispose();
	if (hotbar != null) hotbar.dispose();
	if (chatContainer != null) chatContainer.dispose();
	if (input != null) input.dispose();
	if (tabContainer != null) tabContainer.dispose();
	if (debug != null) debug.dispose();
	if (dot != null) dot.dispose();
	if (pauseScreen != null) pauseScreen.dispose();
}
