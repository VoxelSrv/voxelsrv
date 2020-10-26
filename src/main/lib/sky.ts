import * as BABYLON from '@babylonjs/core/Legacy/legacy';

export function setupSkybox(noa) {
	const scene = noa.rendering.getScene();

	const skybox = BABYLON.Mesh.CreateSphere('skyBox', 32, 1000, scene);

	noa.rendering.addMeshToScene(skybox);
}

export let cloudMesh: BABYLON.Mesh;

export function setupClouds(noa) {
	const scene = noa.rendering.getScene();
	cloudMesh = BABYLON.MeshBuilder.CreatePlane(
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

	const update = () => {
		const x = noa.ents.getState(noa.playerEntity, noa.ents.names.mesh);
		if (x != undefined) {
			cloudMesh.setParent(noa.ents.getState(noa.playerEntity, noa.ents.names.mesh).mesh);
		}

		cloudTexture.vOffset += 0.00001 + (pos[2] - noa.camera.getPosition()[2]) / 10000;
		cloudTexture.uOffset -= (pos[0] - noa.camera.getPosition()[0]) / 10000;
		pos = [...noa.camera.getPosition()];

		cloudMesh.setPositionWithLocalVector(new BABYLON.Vector3(0, 0, 200 - noa.camera.getPosition()[1]));
	};

	noa.on('beforeRender', update);

	cloudMesh.onDisposeObservable.add(() => {
		noa.off('beforeRender', update);
	});
}
