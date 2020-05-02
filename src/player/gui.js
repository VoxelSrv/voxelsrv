import Container from 'noa-engine'
import { Texture } from '@babylonjs/core/Materials/Textures'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'
import { getInventory, inventoryLeftClick, inventoryRightClick } from './player'


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
	var eid = noa.playerEntity
	var inventory = getInventory(1)
	game.hotbarsize = 9

	var div = document.createElement('table')
	div.id = 'game_hotbar'
	var style = 'position:fixed; bottom:5px; left:50%; z-index:0;'
	style += 'color:white; height:auto; width:auto;'
	style += 'font-size:40px; text-align:center; padding:3px;'
	style += 'min-width:2em; transform: translateX(-50%);'
	div.style = style
	document.body.appendChild(div)
	var row = document.createElement('tr')

	var hotbar = {}
	for (var x = 0; x < game.hotbarsize; x++) {
		hotbar[x] = document.createElement('th')
		hotbar[x].id = x
		hotbar[x].addEventListener( 'click', function(){ getInventory(1).selected = parseInt(this.id) } )
		hotbar[x].classList.add('align-bottom')
		hotbar[x].classList.add('hotbar_item')
		row.appendChild(hotbar[x])
	}
	div.appendChild(row)

	noa.on('tick', async function(){
		var inv =  inventory.main
		var sel = inventory.selected
		for (var x = 0; x < game.hotbarsize; x++) {
			if (x == sel && !hotbar[x].classList.contains('hotbar_selected')) hotbar[x].classList.add('hotbar_selected')
			else if (x != sel && hotbar[x].classList.contains('hotbar_selected'))  hotbar[x].classList.remove('hotbar_selected')
			hotbar[x].innerHTML = renderItem(inv[x])
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
	style += 'font-size:20px; margin:4px;'
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

export function openInventory() {
	var inventory = noa.ents.getState(1, 'inventory')
	var items = Object.entries(inventory.main)
	var inv = inventory.main
	inventory.bin = {}

	var screen = document.createElement('div')
	screen.id = 'game_screen'
	var style = 'position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index:1;'
	style += 'color:white; height:auto; width:auto; background-color: #00000055;'
	style += 'font-size:40px; text-align:center; padding:3px;'
	style += 'min-width:2em;'
	screen.style = style
	document.body.appendChild(screen)

	

	var invGui = document.createElement('table')
	invGui.id = 'game_inventory'
	var style = 'position:fixed; bottom:50%; left:50%; z-index:2;'
	style += 'color:white; height:auto; width:auto;'
	style += 'font-size:40px; text-align:center; padding:3px;'
	style += 'min-width:2em; transform: translate(-50%, 50%);'
	invGui.style = style
	screen.appendChild(invGui)
	var hotbar = {}
	var slot = 9

	var bin = document.createElement('th')
	bin.id = -1
	bin.classList.add('align-bottom')
	bin.classList.add('inventory_item_bin')
	bin.addEventListener( 'click', function(){ inventoryLeftClick( parseInt(-1) ); updateInventory() } )
	bin.addEventListener( 'contextmenu', function(){ inventoryRightClick( parseInt(-1) ); updateInventory(); return false } )
	bin.innerHTML = renderItem(inventory.bin)

	invGui.appendChild(bin)

	var tempslot = document.createElement('div')
	tempslot.id = 'tempslot'
	tempslot.classList.add('align-bottom')
	tempslot.classList.add('inventory_temp')
	tempslot.innerHTML = renderItem(inventory.tempslot)

	screen.appendChild(tempslot)


	for (var x = 0; x < (items.length/9)-1; x++) {
		var row = document.createElement('tr')
		invGui.appendChild(row)
		for (var y = 0; y < 9; y++) {
			hotbar[slot] = document.createElement('th')
			hotbar[slot].id = slot
			hotbar[slot].addEventListener( 'click', function(){ inventoryLeftClick( parseInt(this.id) ); updateInventory() } )
			hotbar[slot].addEventListener( 'contextmenu', function(){ inventoryRightClick( parseInt(this.id) ); updateInventory(); return false  } )
			hotbar[slot].classList.add('align-bottom')
			hotbar[slot].classList.add('inventory_item')
			hotbar[slot].innerHTML = renderItem(inv[slot])
			row.appendChild(hotbar[slot])
			slot = slot + 1
		}
	}

	var row_hotbar = document.createElement('tr')
	invGui.appendChild(row_hotbar)
	
	for (var x = 0; x < 9; x++) {
		hotbar[x] = document.createElement('th')
		hotbar[x].id = x
		hotbar[x].classList.add('align-bottom')
		hotbar[x].classList.add('inventory_item_hotbar')
		hotbar[x].addEventListener( 'click', function(){ inventoryLeftClick( parseInt(this.id) ); updateInventory() } )
		hotbar[x].addEventListener( 'contextmenu', function(){ inventoryRightClick( parseInt(this.id) ); updateInventory(); return false  } )
		hotbar[x].innerHTML = renderItem(inv[x])
		row_hotbar.appendChild(hotbar[x])
	}

	window.addEventListener("mousemove", function(e){
		tempslot.style.left = e.x + 'px'
		tempslot.style.top = e.y + 'px'
	});
	function updateInventory() {
		for (var x = 0; x < items.length; x++) {
			hotbar[x].innerHTML = renderItem(inv[x])
		}
		bin.innerHTML = renderItem(inventory.bin)
		tempslot.innerHTML = renderItem(inventory.tempslot)
	}

}


function renderItem(item) {
	if (item.id == undefined) return ''

	var count = ''
	if (item.count == Infinity) count = 'Inf'
	else if (item.count != 1) count = item.count

	try { var txt = game.itemdata[item.id].texture}
	catch { var txt = 'error' }

	return '<img draggable="false" class="img-fluid item_icon" src="textures/' + txt +'.png"><div class="item_count float-right">' + count + '</div>'
}

