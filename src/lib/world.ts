import ndarray = require('ndarray');
import * as pako from 'pako';

const chunkStorage: { [index: string]: any } = {};

export function setupAutoload(noa, socket) {}

export function setChunk(data, noa) {
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

			const localID = data.x + '|' + yoff + '|' + data.z + '|' + noa.worldName;

			for (let x = 0; x < 32; x++) {
				for (let z = 0; z < 32; z++) {
					for (let y = 0; y < 32; y++) {
						const block = chunk.get(x, y + yoff * 32, z);
						noaChunk.set(x, y, z, block);
					}
				}
			}

			chunkStorage[localID] = noaChunk;

			noa.world.setChunkData(localID, noaChunk);
		}

		const pos = noa.ents.getPosition(noa.playerEntity);

		if (data.x == Math.round(pos[0] / 32) && data.z == Math.round(pos[2] / 32)) noa.world.playerChunkLoaded = true;
	} else {
		const localID = data.x + '|' + data.y + '|' + data.z + '|' + noa.worldName;

		const chunk = new ndarray(data.data, [32, 32, 32]);

		chunkStorage[localID] = chunk;

		noa.world.setChunkData(localID, chunk);
	}
}
