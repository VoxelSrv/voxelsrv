var glvec3 = require('gl-vec3')

import { NormalBlendBlock } from "babylonjs"
import { inventoryAdd, getTool } from "./player"
import { getItemType, getItemData } from "../world/items"



var breaking = false
var blockID = 0
var blockPos = [0, 0, 0]
var press = false
var timer = 0



export function initBlockBreak(noa) {
	var tps = 500/noa._tickRate
	var scene = noa.rendering.getScene()
	var breakTXT = {}

    
    for (var x = 0; x <= 10; x++) {
		breakTXT[x] = new BABYLON.Texture( './textures/break/' + x + '.png', scene,
            true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)
        breakTXT[x].hasAlpha = true
    }
	var mesh = new BABYLON.Mesh.CreateBox('highlight', 1.001, scene)

	var mat = new BABYLON.StandardMaterial('highlightMat', scene)
	mat.specularColor = new BABYLON.Color3(0, 0, 0)
	mat.emissiveColor = new BABYLON.Color3(1, 1, 1)
	mat.backFaceCulling = false
    mat.diffuseTexture = null
    //mat.alpha = 0.8
    //mat.alphaMode = BABYLON.Engine.ALPHA_SUBTRACT
    mesh.material = mat

	// outline
	var s = 0.5
	var lines = BABYLON.Mesh.CreateBox("hightlightLines", 1.002, scene)

	lines.color = new BABYLON.Color3(1, 1, 1)
    lines.parent = mesh
    lines.material = new BABYLON.StandardMaterial('highlightMat2', scene)
    lines.material.wireframe = true

	noa.rendering.addMeshToScene(mesh)
	noa.rendering.addMeshToScene(lines)
	noa.rendering._highlightMesh = mesh

	
	noa.on('tick', function() {
        if (timer == 0) {
            noa.rendering._highlightMesh.material.diffuseTexture = breakTXT[0]
        }
		if (press) {
			if (noa.targetedBlock && noa.targetedBlock.blockID == blockID && noa.targetedBlock.position == blockPos) {
				var hardness = game.blockdata[blockID].data.hardness
				var tool = getTool(1).id
                var type = getItemType(tool)
                try {
                    var tooldata = getItemData(tool)
                } catch (e) {}
                try {
                    var power = tooldata.power
                } catch (e) {}
                try {
                    var blockpower = game.blockdata[blockID].data.power
                } catch (e) {var blockpower = 0}

				if (hardness == undefined) hardness = 1
				if (type != 'item' && type == game.blockdata[blockID].data.tool) var hardtick = (hardness-(power*hardness)/5)*tps
				else var hardtick = hardness * tps
				var breakstage = Math.floor((timer/hardtick)*10)

                noa.rendering._highlightMesh.material.diffuseTexture = breakTXT[breakstage]
                
				if (timer >= hardtick) {
                    timer = 0
                    noa.rendering._highlightMesh.material.diffuseTexture = breakTXT[0]
                    
					var block = noa.targetedBlock.blockID
					var item = game.blockdata[block].data.drop
                    noa.setBlock(0, noa.targetedBlock.position)
                    if (type != game.blockdata[blockID].data.tool || blockpower > power) return
					inventoryAdd(1, item, 1, {})
                }
                timer++
			} else if (noa.targetedBlock != undefined) {
				timer = 0
				breaking = true
				blockID = noa.targetedBlock.blockID
				blockPos = noa.targetedBlock.position
				noa.rendering._highlightMesh.material.diffuseTexture = breakTXT[0]
			}
			else {
				breaking = false
				blockID = null
				blockPos = null
				timer = 0
				noa.rendering._highlightMesh.material.diffuseTexture = breakTXT[0]
			}
	
		} else {
			breaking = false
			blockID = null
			blockPos = null
			press = false

		}
	})

    var hlpos = []

    noa.rendering.highlightBlockFace = function (show, posArr, normArr) {
        var m = noa.rendering._highlightMesh
        if (show) {
            // floored local coords for highlight mesh
            this.noa.globalToLocal(posArr, null, hlpos)
            // offset to avoid z-fighting, bigger when camera is far away
            var dist = glvec3.dist(this.noa.camera._localGetPosition(), hlpos)
            hlpos[0] = hlpos[0] + 0.5
            hlpos[1] = hlpos[1] + 0.5
            hlpos[2] = hlpos[2] + 0.5
            
            m.position.copyFromFloats(hlpos[0], hlpos[1], hlpos[2])
        }
        m.setEnabled(show)
    }
	
}


export function startBreakingBlock(pos, id) {
	blockID = id
	blockPos = pos
	breaking = true
	press = true
	timer = 0
}


export function stopBreakingBlock() {
	press = false
	timer = 0
}




