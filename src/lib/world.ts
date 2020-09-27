import ndarray = require('ndarray');
import * as pako from 'pako';
import { EventEmitter } from 'events';
import { IWorldChunkLoad } from 'voxelsrv-protocol/js/server';

export const event = new EventEmitter();

let chunkStorage: { [index: string]: any } = {};

export function setChunk(data: IWorldChunkLoad) {
	if (data.compressed) {
		let x = 0;
		if (data.type) x = 32 * 256 * 32;
		else x = 32 ^ 3;

		data.data = pako.inflate(data.data, new Uint16Array(x));
	}

	if (data.type) {
		const chunk = new ndarray(data.data, [32, 256, 32]);

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
			event.emit(`load-${localID}`, noaChunk);
			event.emit(`loadany`, localID, noaChunk);
			chunkStorage[localID] = noaChunk;
		}
	} else {
		const localID = data.x + '|' + data.y + '|' + data.z + '|';

		const chunk = new ndarray(data.data, [32, 32, 32]);

		event.emit(`load-${localID}`, chunk);
		event.emit(`loadany`, localID, chunk);
		chunkStorage[localID] = chunk;
	}
}

export function removeChunk(id: string) {
	delete chunkStorage[id];
}

export function getChunk(id: string): Promise<ndarray> {
	return new Promise((resolve, reject) => {
		if (chunkStorage[id] != undefined) resolve(new ndarray(chunkStorage[id].data, chunkStorage[id].shape));
		else {
			event.once(`load-${id}`, (noaChunk) => resolve(new ndarray(noaChunk.data, noaChunk.shape)));
			setTimeout(()=>{
				reject('Timeout')
			}, 10000)
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