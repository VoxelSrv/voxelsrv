import {Howl, Howler} from 'howler'


var sounds = {}

export function playSound(sound, volume) {
	var id = Object.keys(sounds)[Object.keys(sounds).length - 1] + 1

	var safeVolume = volume/10

	if (0 > volume ) safeVolume = 0
	else if (1 < volume ) safeVolume = 0.1


	sounds[id] = new Howl({
		src: ['./audio/' + sound],
		volume: safeVolume
	})

	sounds[id].play()
	console.log('Playing: ' + sound)

	sounds[id].once('end', function(){
		delete sounds[id]
	})


	// /playsound music/bulby/lake 1
}