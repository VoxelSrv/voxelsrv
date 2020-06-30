//
// It's broken for now
//

var sounds = {}

export function playSound(sound, volume, scene) {
	var id = Object.keys(sounds)[Object.keys(sounds).length - 1] + 1

	var safeVolume = volume/10

	if (0 > volume ) safeVolume = 0
	else if (1 < volume ) safeVolume = 0.1


	sounds[id] = new BABYLON.Sound(sound, 'audio/' + sound, scene, function() {
		sounds[id].play()
		console.log('Playing: ' + sound)
	
		sounds[id].onended = function() {
			delete sounds[id]
		}
	}, {volume: safeVolume})



	// /playsound music/bulby/lake.mp3 1
}