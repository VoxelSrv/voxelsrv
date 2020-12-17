import * as ndarray from 'ndarray';
import { EventEmitter } from 'events';
import { IWorldChunkLoad } from 'voxelsrv-protocol/js/server';
export const event = new EventEmitter();

let chunkStorage: { [index: string]: any } = {};

declare function inflate(x: Uint8Array, y: number): Promise<Uint8Array>;

export async function setChunk(data: IWorldChunkLoad) {
	let array: Uint16Array;
	if (data.compressed) {
		let x = 0;
		if (data.type) x = 32 * 256 * 32;
		else x = 32 ^ 3;

		data.data = await inflate(data.data, x);
	}

	array = new Uint16Array(data.data.buffer, data.data.byteOffset);

	if (data.type) {
		const chunk = new ndarray(array, [32, 256, 32]);

		for (var yoff = 0; yoff < 8; yoff++) {
			const noaChunk = new ndarray(new Uint16Array(32 * 32 * 32), [32, 32, 32]);

			const localID = [data.x, yoff, data.z].join('|');

			for (let x = 0; x < 32; x++) {
				for (let z = 0; z < 32; z++) {
					for (let y = 0; y < 32; y++) {
						const block = chunk.get(x, y + yoff * 32, z);
						noaChunk.set(x, y, z, block);
					}
				}
			}
			event.emit(`load`, [data.x, data.y + yoff, data.z], noaChunk);
			chunkStorage[localID] = noaChunk;
		}
	} else {
		const localID = [data.x, data.y, data.z].join('|');
		const chunk = new ndarray(array, [32, 32, 32]);

		event.emit(`load`, [data.x, data.y, data.z], chunk);
		chunkStorage[localID] = chunk;
	}
}

export function removeChunk(id: string) {
	delete chunkStorage[id];
}

export function getChunkSync(id: string): ndarray | null {
	if (chunkStorage[id] != undefined && chunkStorage[id].data != null) {
		return new ndarray(chunkStorage[id].data.subarray(0), [...chunkStorage[id].shape]);
	}	
	else return null;
}

export function chunkExist(id) {
	return chunkStorage[id] != undefined;
}

/**
 * @deprecated
 */

export function getChunk(id: string): Promise<ndarray> {
	return new Promise((resolve, reject) => {
		if (chunkStorage[id] != undefined) resolve(new ndarray(chunkStorage[id].data, chunkStorage[id].shape));
		else {
			event.once(`load-${id}`, (noaChunk) => resolve(new ndarray(noaChunk.data, noaChunk.shape)));
			setTimeout(() => {
				reject('Timeout');
			}, 200000);
		}
	});
}

export function chunkSetBlock(id: number, x: number, y: number, z: number) {
	const cid = [Math.floor(x / 32), Math.floor(y / 32), Math.floor(z / 32)].join('|');

	if (chunkStorage[cid] == undefined) return;

	let xl = x % 32;
	let yl = y % 32;
	let zl = z % 32;

	if (xl < 0) xl = xl + 32;
	if (yl < 0) yl = yl + 32;
	if (zl < 0) zl = zl + 32;

	chunkStorage[cid].set(xl, yl, zl, id);
}

export function clearStorage() {
	chunkStorage = {};
}



export function setupWorld(noa) {
	noa.world.on('worldDataNeeded', async (id: string) => {
		const ida = id.split('|');

		const chunk = getChunkSync(`${ida[0]}|${ida[1]}|${ida[2]}`);
		if (chunk != null) {
			noa.world.setChunkData(id, chunk);
		}
	});

	noa.world.on('playerEnteredChunk', (ci, cj, ck) => {
		const add = noa.world.chunkAddDistance;
		let i, j, k;

		for (i = ci - add; i <= ci + add; ++i) {
			for (j = cj - add; j <= cj + add; ++j) {
				for (k = ck - add; k <= ck + add; ++k) {
					if (noa.world._chunksKnown.includes(i, j, k)) continue;

					if (chunkExist([i, j, k].join('|'))) {
						noa.world.manuallyLoadChunk(i * 32, j * 32, k * 32);
					}
				}
			}
		}

		const dist = noa.world.chunkRemoveDistance;

		noa.world._chunksKnown.forEach((loc) => {
			if (noa.world._chunksToRemove.includes(loc[0], loc[1], loc[2])) return;
			var di = loc[0] - ci;
			var dj = loc[1] - cj;
			var dk = loc[2] - ck;
			if (dist <= Math.abs(di) || dist <= Math.abs(dj) || dist <= Math.abs(dk)) noa.world.manuallyUnloadChunk(loc[0] * 32, loc[1] * 32, loc[2] * 32);
		});
	});

	event.on('load', ([x, y, z]) => {
		const add = noa.world.chunkAddDistance;

		const pos = noa.ents.getPosition(noa.playerEntity);
		const ci = Math.ceil(pos[0] / 32);
		const cj = Math.ceil(pos[1] / 32);
		const ck = Math.ceil(pos[2] / 32);

		if (x > ci - add && x < ci + add && y > cj - add && y < cj + add && z > ck - add && z < ck + add) {
			noa.world.manuallyLoadChunk(x * 32, y * 32, z * 32);
		}
	});

	setInterval(() => {
		if (!noa.world.playerChunkLoaded) {
			const pos = noa.ents.getPosition(noa.playerEntity);
			const i = Math.ceil(pos[0] / 32);
			const j = Math.ceil(pos[1] / 32);
			const k = Math.ceil(pos[2] / 32);
			
			if (chunkExist([i, j, k].join('|'))) {
				noa.world.manuallyLoadChunk(i * 32, j * 32, k * 32);
			}
		}
	}, 500);
}