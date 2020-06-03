
// storage for data from voxels that were unloaded

import Worker from "worker-loader!./world"



export function initWorldGen(noa) {
	noa.worldName = game.world

	var queue = []
	// set up worldgen web worker
	var worker = new Worker()
	var init = false

	// send block id values to worker
	worker.postMessage({
		msg: 'init',
		blocks: game.blocks,
		seed: game.seed,
		chunksize: noa.world.chunkSize

	})

	// game listener for when worldgen is requested (array is an ndarray)
	noa.world.on('worldDataNeeded', function (id, array, x, y, z) {
		var msg = {
			msg: 'generate',
			data: array.data,
			shape: array.shape,
			id: id,
			x: x, y: y, z: z,
		}
		if (init == false) queue.push(msg)
		worker.postMessage(msg)
	})

	noa.world.on('chunkBeingRemoved', function (id, array, userData) {
		if (init == true) {
			worker.postMessage({
				msg: 'savechunk',
				data: array.data,
				shape: array.shape,
				id: id
			})
		}
	})


	// worker listener for when chunk generation is finished
	worker.addEventListener('message', function (ev) {
		if (ev.data.msg == 'generated') {
			// wrap result (copied from worker) in a new ndarray before returning
			var id = ev.data.id
			var array = new ndarray(ev.data.data, ev.data.shape)
			// send result to game for processing
			noa.world.setChunkData(id, array)
		} else if (ev.data.msg == 'debug') {
			console.log(ev.data.data)
		} else if (ev.data.msg == 'initialized') {
			init = true
			console.log('Worldgen started')
			queue.forEach(function(msg){
				worker.postMessage(msg)
			})
			queue = []
		}
	})

}


