import { setupDebug, setupDot } from './debug';
import { buildHotbar, buildInventory } from './inventory';
import { setupHand } from './hand';
import { setupChat } from './chat';

export default function setupGuis(noa, socket, dataPlayer, dataLogin) {
	buildHotbar(noa);
	setupDot();
	setupDebug(noa, socket.server);
	buildInventory(noa, socket);
	setupChat();
	//setupHand(noa);
}
