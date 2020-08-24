import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { GradientMaterial } from '@babylonjs/materials/gradient';

export function setupSkybox(noa) {
	const scene = noa.rendering.getScene();

	const skyMaterial = new GradientMaterial('skyMaterial', scene);
	skyMaterial.backFaceCulling = false;
	skyMaterial.topColor = new BABYLON.Color3(0.6, 0.7, 1); // Set the gradient top color
	skyMaterial.bottomColor = new BABYLON.Color3(0.8, 0.9, 1); // Set the gradient bottom color
	skyMaterial.offset = -3;
	skyMaterial.scale = 0.05
	skyMaterial.smoothness = 4


	const skybox = BABYLON.Mesh.CreateSphere('skyBox', 32, 1000, scene);
	skybox.material = skyMaterial;

	noa.rendering.addMeshToScene(skybox);
}

export function setupClouds(noa) {
	const scene = noa.rendering.getScene();
	const cloudMesh = BABYLON.MeshBuilder.CreatePlane(
		'cloudMesh',
		{
			height: 1.5e3,
			width: 1.5e3,
		},
		scene
	);
	const cloudMat = new BABYLON.StandardMaterial('cloud', scene);

	const cloudTexture = new BABYLON.Texture('./textures/environment/clouds.png', scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	cloudTexture.hasAlpha = true;
	cloudTexture.vScale = 0.75;
	cloudTexture.uScale = 0.75;

	cloudMat.diffuseTexture = cloudTexture;
	cloudMat.opacityTexture = cloudTexture;
	cloudMat.backFaceCulling = false;
	cloudMat.emissiveColor = new BABYLON.Color3(1, 1, 1);

	cloudMesh.rotation.x = -Math.PI / 2;
	cloudMesh.material = cloudMat;

	noa.rendering.addMeshToScene(cloudMesh, false);

	cloudMesh.setPositionWithLocalVector(new BABYLON.Vector3(0, 0, 200));

	let pos = [...noa.camera.getPosition()];

	noa.on('beforeRender', function () {
		const x = noa.ents.getState(noa.playerEntity, noa.ents.names.mesh)
		if (x!= undefined) cloudMesh.setParent(noa.ents.getState(noa.playerEntity, noa.ents.names.mesh).mesh);

		cloudTexture.vOffset += 0.00001 + (pos[2] - noa.camera.getPosition()[2]) / 10000;
		cloudTexture.uOffset -= (pos[0] - noa.camera.getPosition()[0]) / 10000;
		pos = [...noa.camera.getPosition()];

		cloudMesh.setPositionWithLocalVector(new BABYLON.Vector3(0, 0, 200 - noa.camera.getPosition()[1]));
	});
}
