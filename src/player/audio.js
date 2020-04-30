import {Howl, Howler} from 'howler'

	var music = new Howl({
		volume: 0.15,
		loop: true,
		src: ['audio/drops.mp3']
	})

export function initMusic() {
	music.play()
}

export function setMusicVolume(value) {
	music.volume(value)
}

export function getMusicVolume() {
	return music.volume()

}
