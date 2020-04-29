import Container from 'noa-engine'
import { Texture } from '@babylonjs/core/Materials/Textures'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'


export function setupGUI(noa) {
	setupBlockGUI()
	setupInfoGUI()
	setupSkybox()
	//setupHand()
	setupCross()

	noa.on('tick', function(){
		var i = (inventory[pickedID] > 0) ? inventory[pickedID] : 0
		updateBlockGUI(game.blockNames[pickedID] + ' ' + '(' + pickedID + ') | ' + i )
		updatePos()
	});
}

export function updateBlockGUI(id) {
	document.getElementById('game_selectedblock').innerHTML = id
}

function setupBlockGUI() {
	var div = document.createElement('div')
	div.id = 'game_selectedblock'
	var style = 'position:absolute; bottom:5px; left:5px; z-index:0;'
	style += 'color:white; background-color:rgba(0,0,0,0.5);'
	style += 'font-size:40px; text-align:center; padding:6px;'
	style += 'min-width:2em; margin:4px;'
	div.style = style
	document.body.appendChild(div)
	updateBlockGUI(1)
}


function setupHand() {
	var scene = noa.rendering.getScene()
	var eid = noa.playerEntity
	global.hand = BABYLON.MeshBuilder.CreateBox("hand", {size:0.2}, scene)
	var handMaterial = new BABYLON.StandardMaterial("hand", scene)
	hand.material = handMaterial

	noa.rendering.addMeshToScene(hand, false)
	noa.on('beforeRender', function(){
		var dat = noa.entities.getPositionData(eid)
		var pos = noa.camera._localGetPosition()
		var dirPos = noa.camera.getDirection()
		var pitch = noa.camera['pitch']
		var yaw = noa.camera['yaw']
		hand.position = new BABYLON.Vector3(pos[0] * Math.sin(yaw), pos[1], pos[2] * Math.cos(yaw));
		hand.rotation.y += .03;
		
		var	mat = noa.registry.getBlockFaceMaterial(pickedID, 0)
		try {
			var txt = noa.registry.getMaterialTexture(mat)
		} catch(error) {var txt = null}
		handMaterial.ambientTexture = new BABYLON.Texture(txt, scene)
		handMaterial.ambientTexture.hasAlpha = true
		//handMaterial.ambientTexture.noMipmap = true


	})
}

function setupInfoGUI() {
	var div = document.createElement('div')
	div.id = 'game_version'
	var style = 'position:absolute; top:5; left:5; z-index:0;'
	style += 'color:white; text-shadow: 1px 1px black;'
	style += 'font-size:28px; margin:4px;'
	div.style = style
	div.innerHTML = game.name + ' ' + game.version +'<br>Noa: ' + noa.version + '<br>World: ' + noa.worldName + '<br><span id="player_pos"></span>' 
	document.body.appendChild(div)
}

function updatePos() {
	var eid = noa.playerEntity
	var dat = noa.entities.getPositionData(eid)
	document.getElementById('player_pos').innerHTML = 'X: ' + Math.round(dat.position[0]) + ' Y: ' + Math.round(dat.position[1]) + ' Z: ' + Math.round(dat.position[2])
}


function setupCross() {
	var div = document.createElement('div')
	div.id = 'game_cross'
	var style = 'position:absolute; top:50%; left:50%; z-index:0;'
	style += 'transform: translate(-50% -50%); border-radius:50%; background-color: white;'
	style += 'filter: opacity(0.5);height:6px; width:6px; backdrop-filter: invert(1);'
	div.style = style
	document.body.appendChild(div)
}

function setupSkybox() {
	var scene = noa.rendering.getScene()

	var skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size:1000.0}, scene)
	var skyboxMaterial = new BABYLON.StandardMaterial("skybox", scene)
	skyboxMaterial.backFaceCulling = false
	skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/skybox", scene)
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skybox.material = skyboxMaterial

	noa.rendering.addMeshToScene(skybox, false)


	noa.on('beforeRender', function(){
		var eid = noa.playerEntity
		var pos = noa.entities.getPositionData(eid)['_renderPosition']
		skybox.setPositionWithLocalVector(new BABYLON.Vector3(pos[0], pos[1], pos[2]))

	});
}



