import ndarray = require('ndarray');
import { blockIDs } from './registry';

//import * as cruncher from 'voxel-crunch';

export function setChunk(data, noa) {
	if (data.type) {
		//const chunkdata = cruncher.decode(Object.values(data.data), new Uint16Array(32 * 256 * 24));
		const chunk = new ndarray(data.data, [32, 256, 32]);

		for (var yoff = 0; yoff < 8; yoff++) {
			const noaChunk = new ndarray(new Uint16Array(32 * 32 * 32), [32, 32, 32]);
			const localID = data.x + '|' + yoff + '|' + data.z + '|default';
			for (let x = 0; x < 32; x++) {
				for (let z = 0; z < 32; z++) {
					for (let y = 0; y < 32; y++) {
						const block = chunk.get(x, y + yoff * 32, z);
						noaChunk.set(x, y, z, block);
					}
				}
			}
			noa.world.setChunkData(localID, noaChunk);
		}
	} else {
		var localID = data.x + '|' + data.y + '|' + data.z + '|default';
		//const chunkdata = cruncher.decode(Object.values(data.data), new Uint16Array(32 * 256 * 24));
		const chunk = new ndarray(data.data, [32, 32, 32]);

		noa.world.setChunkData(localID, chunk);
	}
}
