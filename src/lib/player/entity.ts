import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import type { Engine } from 'noa-engine';
import { InventoryType } from 'voxelsrv-protocol/js/client';
import { IPlayerSpawn } from 'voxelsrv-protocol/js/server';


/*
 *
 * Setups player's entity after joining server.
 *
 */

export function setupPlayerEntity(noa: Engine, data: IPlayerSpawn): void {
	const eid = noa.playerEntity;
	const dat = noa.entities.getPositionData(eid);

	const scene = noa.rendering.getScene();

	dat.height = data.entity.height || 1.8;
	dat.width = data.entity.witdh || 0.8;

	const w = dat.width;
	const h = dat.height;

	const eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height;

	const offset = [0, h / 2, 0];

	// Gamemode and players settings

	const move = noa.entities.getMovement(eid);

	if (!!data.movement) {
		Object.entries(data.movement).forEach((s) => {
			move[s[0]] = s[1];
		});
	}

	// Create inventory, move it to global entities js in future

	if (data.inventory != undefined) noa.ents.addComponentAgain(eid, 'inventory', data.inventory);

	noa.entities.addComponentAgain(eid, "mesh", {
		mesh: new BABYLON.Mesh('main', scene),
		offset: offset,
	});
}



export interface IInventory {
	items: {[x: number]: {id: string, count: number} | {} | null}
	size: number
}
