import {Howl, Howler} from 'howler'

export function initMusic() {

	var sound = new Howl({
		volume: 0.15,
		src: ['audio/drops.mp3']
	})
	sound.volume
	sound.play()

}
