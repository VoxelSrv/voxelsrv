import Container from 'noa-engine'
import { Texture } from '@babylonjs/core/Materials/Textures'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'
import { getInventory } from './player'


export function setupGUI(noa) {
	setupHotbarGUI()
	setupInfoGUI()
	setupSkybox()
	//setupHand()
	setupCross()
	setupChatBox()
	noa.on('tick', function(){
		updatePos()
	});
}


function setupHotbarGUI() {
	game.hotbarsize = 27

	var div = document.createElement('div')
	div.id = 'game_hotbar'
	var style = 'position:fixed; bottom:5px; left:50%; z-index:0;'
	style += 'color:white; height:auto; width:auto;'
	style += 'font-size:40px; text-align:center; padding:3px;'
	style += 'min-width:2em; transform: translateX(-50%);'
	div.style = style
	document.body.appendChild(div)
	var hotbar = {}
	for (var x = 0; x < game.hotbarsize; x++) {

		hotbar[x] = document.createElement('div')
		hotbar[x].id = 'game_hotbar_item'
		hotbar[x].classList.add('align-bottom')
		hotbar[x].classList.add('hotbar_item')
		div.appendChild(hotbar[x])
	}

	noa.on('tick', async function(){
		var eid = noa.playerEntity
		var inventory = getInventory(1)
		var inv =  inventory.main
		var sel = inventory.selected
		for (var x = 0; x < game.hotbarsize; x++) {

			if (x == sel && !hotbar[x].classList.contains('hotbar_selected')) hotbar[x].classList.add('hotbar_selected')
			else if (x != sel && hotbar[x].classList.contains('hotbar_selected'))  hotbar[x].classList.remove('hotbar_selected')
			hotbar[x].innerHTML = (inv[x].id != undefined) ? '<img class="img-fluid item_icon" src="textures/' + 
				game.itemdata[inv[x].id].texture + '.png"><div class="item_count float-right">' +
				((inv[x].count > 1) ?  inv[x].count : '') + '</div>' : ''
		}
	});
}


function setupHand() {
	var scene = noa.rendering.getScene()
	var eid = noa.playerEntity
	var hand = BABYLON.MeshBuilder.CreateBox("hand", {size:0.1}, scene)
	var handMaterial = new BABYLON.StandardMaterial("hand", scene)
	hand.material = handMaterial
	hand.parent = scene.activeCamera
	hand.rotation.y = -Math.PI/8
	noa.rendering.addMeshToScene(hand, false)
	noa.on('tick', function() {
		var inventory = getInventory(1)
		var inv =  inventory.main
		var sel = inventory.selected
		try {
			var txt = 'textures/' + game.itemdata[inv[sel].id].texture + '.png'
			hand.position = new BABYLON.Vector3(0.08, -0.08, 0.08);
		} catch {
			var txt = null
			hand.position = new BABYLON.Vector3(99.08, 99.08, 99.08);
		}
		var mat = new BABYLON.Texture(txt, scene, false, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
		handMaterial.ambientTexture = mat
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


function setupChatBox() {
	var div = document.createElement('div')
	div.id = 'game_chatbox'
	div.classList.add('col-3')
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



