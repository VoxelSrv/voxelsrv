import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import type { Engine } from 'noa-engine';


/*
 *
 * Setups player's entity after joining server.
 *
 */

export function setupPlayerEntity(noa: Engine, invData: object, arrData: object, movement: object): void {
	const eid = noa.playerEntity;
	const dat = noa.entities.getPositionData(eid);

	const scene = noa.rendering.getScene();

	const w = dat.width;
	const h = dat.height;

	const eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height;

	const offset = [0, h / 2, 0];

	// Gamemode and players settings

	const move = noa.entities.getMovement(eid);

	if (!!movement) {
		Object.entries(movement).forEach((s) => {
			move[s[0]] = s[1];
		});
	}

	// Create inventory, move it to global entities js in future

	if (invData != undefined) noa.ents.addComponentAgain(eid, 'inventory', invData);

	if (arrData != undefined) noa.ents.getState(eid, 'inventory').armor = arrData;

	noa.ents.getState(eid, 'inventory').crafting = { 1: {}, 2: {}, 3: {}, 4: {} };

	noa.entities.addComponentAgain(eid, "mesh", {
		mesh: new BABYLON.Mesh('main', scene),
		offset: offset,
	});
}



export interface IInventory {
	items: {[x: number]: {id: string, count: number} | {} | null}
	size: number
}
