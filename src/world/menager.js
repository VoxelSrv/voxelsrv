
// storage for data from voxels that were unloaded

import Worker from "worker-loader!./world"



export function initWorldGen(noa) {
	noa.worldName = game.world


	  // set up worldgen web worker
	var worker = new Worker()

	// send block id values to worker
	worker.postMessage({
		msg: 'init',
		blocks: game.blocks,
		seed: game.seed,
		generator: game.generator

	})

	// game listener for when worldgen is requested (array is an ndarray)
	noa.world.on('worldDataNeeded', function (id, array, x, y, z) {
		worker.postMessage({
			msg: 'generate',
			data: array.data,
			shape: array.shape,
			id: id,
			x: x, y: y, z: z,
		})
	})

	noa.world.on('chunkBeingRemoved', function (id, array, userData) {
		worker.postMessage({
			msg: 'savechunk',
			data: array.data,
			shape: array.shape,
			id: id
		})
	})


	// worker listener for when chunk generation is finished
	worker.addEventListener('message', function (ev) {
		if (ev.data.msg == 'generated') {
			// wrap result (copied from worker) in a new ndarray before returning
			var id = ev.data.id
			var array = new ndarray(ev.data.data, ev.data.shape)
			// send result to game for processing
			noa.world.setChunkData(id, array)
		} else if (ev.data.msg == 'remove') {
			var splitID = ev.data.id.split("|")
			noa.world.invalidateVoxelsInAABB({
				base: [(splitID[0]-1)*24, (splitID[1]-1)*24, (splitID[2]-1)*24],
				max: [(splitID[0]+1)*24, (splitID[1]+1)*24, (splitID[2]+1)*24]
			
			})
		} else if (ev.data.msg == 'debug') {
			console.log(ev.data.data)
		}
	})

}


