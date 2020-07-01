import * as BABYLON from '@babylonjs/core/Legacy/legacy'

var sounds = {}

export function playSound(sound, volume, position, noa) {
	var id = Object.keys(sounds)[Object.keys(sounds).length - 1] + 1

	var safeVolume = volume/10

	if (0 > volume ) safeVolume = 0
	else if (1 < volume ) safeVolume = 0.1

	console.log('Playing: ' + sound, 'Volume: ' + volume, 'Position: ' + position)

	if ( (sound.startsWith('http://') || sound.startsWith('https://' ) && game.allowCustom == true)) var url = sound
	else var url = 'audio/' + sound

	if (position != undefined) {
		sounds[id] = new BABYLON.Sound('Sound', url, noa.rendering.getScene(), play, 
			{ volume: safeVolume, spatialSound: true, maxDistance: 100})
		sounds[id].setPosition(new BABYLON.Vector3(position[0], position[1], position[2]) )
	} else {
		sounds[id] = new BABYLON.Sound('Sound', url, noa.rendering.getScene(), play, 
			{ volume: safeVolume})
	}

	sounds[id].onended = function() {
		delete sounds[id]
	}

	function play() { sounds[id].play() }


	// /playsound music/bulby/lake.mp3 1
}