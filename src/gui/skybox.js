import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { GradientMaterial } from '@babylonjs/materials/gradient';


var skybox

export function setupSkybox(noa, data) {
	var scene = noa.rendering.getScene()

	var skyMaterial = new GradientMaterial("skyMaterial", scene)
	skyMaterial.backFaceCulling = false
	skyMaterial.topColor = new BABYLON.Color3(0, 0.8, 1)
    skyMaterial.bottomColor = new BABYLON.Color3(1, 1, 1)
    skyMaterial.offset = 0.5
    skyMaterial.smoothness = 100

	skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene)
	skybox.material = skyMaterial


	//skybox.setParent(noa.rendering.getScene().activeCamera)
	noa.rendering.addMeshToScene(skybox)

	/*
	noa.on('beforeRender', function() {
		skybox.material.inclination = skybox.material.inclination + 0.001
	})
	*/
}


export function setupClouds(noa) {
	var scene = noa.rendering.getScene()

	var cloudMesh = new BABYLON.MeshBuilder.CreatePlane("cloudMesh", {
			height: 2e3,
			width: 2e3
	}, scene)

	var cloudMat = new BABYLON.StandardMaterial("cloud", scene)
	
	var cloudTexture = new BABYLON.Texture('./textures/environment/clouds.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	
	cloudMat.diffuseTexture = cloudTexture
	cloudMat.diffuseTexture.hasAlpha = true
	cloudMat.opacityTexture = cloudTexture
	cloudMat.backFaceCulling = false
	cloudMat.emissiveColor = new BABYLON.Color3(1, 1, 1)


	cloudMesh.rotation.x = -Math.PI / 2;
	cloudMesh.material = cloudMat

	noa.rendering.addMeshToScene(cloudMesh, false)

	cloudMesh.setPositionWithLocalVector(new BABYLON.Vector3(0, 0, 120))

	cloudMesh.setParent(noa.ents.getState(noa.playerEntity, noa.ents.names.mesh).mesh)

	var pos = [...noa.camera.getPosition()]

	noa.on('beforeRender', function() {
		cloudMat.diffuseTexture.vOffset += 0.00001 + (pos[2] - noa.camera.getPosition()[2]) /10000
		cloudMat.diffuseTexture.uOffset -= (pos[0] - noa.camera.getPosition()[0]) /10000
		pos = [...noa.camera.getPosition()]

		cloudMesh.setPositionWithLocalVector(new BABYLON.Vector3(0, 0, 120 - noa.camera.getPosition()[1] ) )
	})


}