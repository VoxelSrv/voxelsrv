import * as ndarray from 'ndarray';
import { EventEmitter } from 'events';
import { IWorldChunkLoad } from 'voxelsrv-protocol/js/server';
import { spawn, Worker } from 'threads';
import { Engine } from 'noa-engine';

export const event = new EventEmitter();

export type StoredChunk = { chunk: ndarray; light: ndarray };

let chunkStorage: { [index: string]: StoredChunk } = {};

let inflate: (x: Uint8Array, y: number) => Promise<Uint8Array>;

export async function createInflateWorker() {
	const x: any = await spawn(new Worker('./inflate.js'));
	inflate = x;
}

/*
 * Sets chunk in storage
 */

export async function setChunk(data: IWorldChunkLoad) {
	const height = data.height > 0 ? data.height : 1;

	if (data.compressed) {
		// Decompress
		let x = 32 * 32 * 32 * height;
		data.data = await inflate(data.data, x);
	}

	let array = new Uint16Array(data.data.buffer, data.data.byteOffset);

	// Creates chunk, used for breaking it into 32x32x32 ones
	const chunk = new ndarray(array, [32, 32 * height, 32]);

	for (var yoff = 0; yoff < height; yoff++) {
		const noaChunk = new ndarray(new Uint16Array(32 * 32 * 32), [32, 32, 32]);

		const localID = [data.x, data.y + yoff, data.z].join('|');

		for (let x = 0; x < 32; x++) {
			for (let z = 0; z < 32; z++) {
				for (let y = 0; y < 32; y++) {
					const block = chunk.get(x, y + yoff * 32, z);
					noaChunk.set(x, y, z, block);
				}
			}
		}
		const a = new Uint8Array(32 * 32 * 32);
		const lightChunk = new ndarray(a.fill(100, 0, a.length), [32, 32, 32]);
		const sc: StoredChunk = { chunk: noaChunk, light: lightChunk };

		event.emit(`load`, [data.x, data.y + yoff, data.z], sc);
		chunkStorage[localID] = sc;
	}
}

/*
 * Removes chunk from storage
 */
export function removeChunk(id: string) {
	delete chunkStorage[id];
}

/*
 * Returns chunk (if exist) or null
 */

export function getChunkSync(id: string): StoredChunk | null {
	if (chunkStorage[id] != undefined && chunkStorage[id].chunk != null && chunkStorage[id].light != null) {
		return {
			chunk: new ndarray(chunkStorage[id].chunk.data.subarray(0), [...chunkStorage[id].chunk.shape]),
			light: new ndarray(chunkStorage[id].light.data.subarray(0), [...chunkStorage[id].light.shape]),
		};
	} else return null;
}

/*
 * Checks if chunk exist
 */

export function chunkExist(id) {
	return chunkStorage[id] != undefined;
}

/*
 * Sets blocks in chunks
 */

export function chunkSetBlock(id: number, x: number, y: number, z: number, light: number) {
	const cid = [Math.floor(x / 32), Math.floor(y / 32), Math.floor(z / 32)].join('|');

	if (chunkStorage[cid] == undefined) return;

	let xl = x % 32;
	let yl = y % 32;
	let zl = z % 32;

	if (xl < 0) xl = xl + 32;
	if (yl < 0) yl = yl + 32;
	if (zl < 0) zl = zl + 32;

	chunkStorage[cid].chunk.set(xl, yl, zl, id);
	chunkStorage[cid].light.set(xl, yl, zl, light);
}

/*
 * Removes all stored chunks
 */

export function clearStorage() {
	chunkStorage = {};
}

/*
 * Setups noa for chunk loading
 */

export function setupWorld(noa) {
	noa.world.on('worldDataNeeded', async (id: string) => {
		const ida = id.split('|');

		const chunk = getChunkSync(`${ida[0]}|${ida[1]}|${ida[2]}`);
		if (chunk != null) {
			noa.world.setChunkData(id, chunk.chunk, {}, chunk.light);
		}
	});

	noa.world.on('playerEnteredChunk', (ci, cj, ck) => {
		checkAndLoadChunks(noa, ci, cj, ck);
	});

	event.on('load', ([x, y, z]) => {
		const addX = noa.world.chunkAddDistance[0];
		const addY = noa.world.chunkAddDistance[1];

		const pos = noa.ents.getPosition(noa.playerEntity);
		const ci = Math.ceil(pos[0] / 32);
		const cj = Math.ceil(pos[1] / 32);
		const ck = Math.ceil(pos[2] / 32);

		if (x > ci - addX && x < ci + addX && y > cj - addY && y < cj + addY && z > ck - addX && z < ck + addX) {
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

export function checkAndLoadChunks(noa: Engine, ci: number, cj: number, ck: number) {
	const addX = noa.world.chunkAddDistance[0];
	const addY = noa.world.chunkAddDistance[1];

	let i, j, k;

	for (i = ci - addX; i <= ci + addX; ++i) {
		for (j = cj - addY; j <= cj + addY; ++j) {
			for (k = ck - addX; k <= ck + addX; ++k) {
				if (noa.world._chunksKnown.includes(i, j, k)) continue;

				if (chunkExist([i, j, k].join('|'))) {
					noa.world.manuallyLoadChunk(i * 32, j * 32, k * 32);
				}
			}
		}
	}

	const distX = noa.world.chunkRemoveDistance[0];
	const distY = noa.world.chunkRemoveDistance[1];

	noa.world._chunksKnown.forEach((loc) => {
		if (noa.world._chunksToRemove.includes(loc[0], loc[1], loc[2])) return;
		var di = loc[0] - ci;
		var dj = loc[1] - cj;
		var dk = loc[2] - ck;
		if (distX <= Math.abs(di) || distY <= Math.abs(dj) || distX <= Math.abs(dk)) noa.world.manuallyUnloadChunk(loc[0] * 32, loc[1] * 32, loc[2] * 32);
	});
}
