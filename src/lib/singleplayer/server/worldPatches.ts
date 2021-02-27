import { World } from 'voxelsrv-server/dist/lib/world/world';
import format from 'voxelsrv-server/src/formats/world';
import * as pako from 'pako';
import * as fs from 'fs';
import * as types from 'voxelsrv-server/dist/types';
import * as ndarray from 'ndarray';

export default function () {
	World.prototype.saveChunk = async function (id) {
		if (this.isChunkInBounds(id)) {
			const idS = id.toString();
			const chunk = this.chunks[idS];
			if (chunk == undefined || chunk.metadata == undefined || chunk.data == undefined) return;
			const message = format.chunk.create({
				blocks: Buffer.from(chunk.data.data.buffer, chunk.data.data.byteOffset),
				version: chunk.metadata.ver,
				stage: chunk.metadata.stage,
			});
			const buffer = format.chunk.encode(message).finish();
			const data = pako.deflate(buffer);
			fs.writeFile(this.chunkFolder + '/' + idS + '.chk', btoa(String.fromCharCode.apply(null, data)), function (err) {
				if (err) this._server.log.console.error('Cant save chunk ' + id + '! Reason: ' + err);
			});
		}
	};

	World.prototype.readChunk = async function (id: types.XZ): Promise<{ chunk: types.IView3duint16; metadata: any }> {
		return this.readChunkSync(id);
	};

	World.prototype.readChunkSync = function (id: types.XZ): { chunk: types.IView3duint16; metadata: any } {
		const idS = id.toString();

		const exist = this.existChunk(id);
		let chunk = null;
		let meta = null;
		if (exist) {
			const data = fs.readFileSync(this.chunkFolder + '/' + idS + '.chk');
			const array = pako.inflate(atob(String.fromCharCode(...new Uint8Array(data))));
			const decoded = format.chunk.decode(array);

			chunk = new ndarray(new Uint16Array(decoded.blocks.buffer, decoded.blocks.byteOffset), [
				this._worldMen.chunkWitdh,
				this._worldMen.chunkHeight,
				this._worldMen.chunkWitdh,
			]);
			meta = { stage: decoded.stage, version: decoded.version };
		}
		return { chunk: chunk, metadata: meta };
	};
}
