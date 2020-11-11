import { gameSettings } from '../values';

let server = '';

export function setAssetServer(t: string) {
	server = t;
}

export function getAsset(asset: string, type: string): string {
	if (asset.startsWith('http://') || asset.startsWith('https://'))
		return type == 'texture' ? './textures/error.png' : type == 'model' ? './models/player.json' : '';
	else if (asset.startsWith('server:')) {
		if (!gameSettings.allowcustom) return type == 'texture' ? './textures/error.png' : type == 'model' ? './models/player.json' : '';
		asset = asset.substr(7);
		switch (type) {
			case 'texture':
				return `${server}/${asset}.png`;
			case 'sound':
				return `${server}/${asset}.ogg`;
			case 'audio':
				return `${server}/${asset}.ogg`;
			case 'model':
				return `${server}/${asset}.json`;
			default:
				return `${server}/${asset}`;
		}
	} else if (asset.startsWith('skins:')) {
		return './textures/entity/steve.png';
	} else {
		switch (type) {
			case 'texture':
				return `./textures/${asset}.png`;
			case 'sound':
				return `./audio/${asset}.ogg`;
			case 'audio':
				return `./audio/${asset}.ogg`;
			case 'model':
				return `./models/${asset}.json`;
			default:
				return `./${type}/${asset}`;
		}
	}
}
