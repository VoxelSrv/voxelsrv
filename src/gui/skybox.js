import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { SkyMaterial } from '@babylonjs/materials/sky';


var skybox

export function setupSkybox(noa, data) {
	var scene = noa.rendering.getScene()

	var skyMaterial = new SkyMaterial("skyMaterial", scene)
	skyMaterial.backFaceCulling = false

	skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene)
	skybox.material = skyMaterial


	skybox.setParent(noa.rendering.getScene().activeCamera)
	noa.rendering.addMeshToScene(skybox)

	noa.on('beforeRender', function() {
		skybox.material.inclination = skybox.material.inclination + 0.001
	})
}