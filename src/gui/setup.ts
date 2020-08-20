import { setupDebug, setupDot } from './debug';
import { buildHotbar, buildInventory } from './inventory';

export default function setupGuis(noa, socket, dataPlayer, dataLogin) {
	buildHotbar(noa);
	setupDot();
	setupDebug(noa, socket.server);
	buildInventory(noa, socket);
}
