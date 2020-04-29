export function initPhysics(noa) {

	noa.on('tick', function () {
		worldTime++
		noa.clearColor = [worldTime*0.1, worldTime*0.1, worldTime*0.1]
	})
	
}


function blockUpdate(noa) {}

global.worldTime = 0;

