import JSZip from 'jszip';
import { getWorld, getWorldData, getWorldList, IWorld, IWorldData, saveWorld } from '../helpers/storage';
import * as pako from 'pako';

export async function exportWorldAsZip(worldname: string): Promise<Blob> {
	const worldInfo = await getWorld(worldname);
	const worldData = await getWorldData(worldname);

	const zip = new JSZip();

	zip.file('spWorldSettings.json', JSON.stringify(worldInfo.settings));

	for (const path in worldData.data) {
		if (path.endsWith('.chk')) {
			const base64Chunk = worldData.data[path];
			zip.file(path, Uint8Array.from(atob(base64Chunk), c => c.charCodeAt(0)));
		} else {
			zip.file(path, worldData.data[path]);
		}
	}

	const blob = await zip.generateAsync({ type: 'blob' });

	return blob;
}

export async function exportWorldAsString(worldname: string): Promise<string> {
	const worldInfo = await getWorld(worldname);
	const worldData = await getWorldData(worldname);

	const obj = {
		worldInfo,
		worldData
	}

	return btoa(pako.deflate(JSON.stringify(obj)));
}


export async function importWorldFromString(base64: string): Promise<string> {
	const worlds = await getWorldList();

	const takenNames = [];

	worlds.forEach((w) => {
		takenNames.push(w.name);
	})

	const obj: {worldInfo: IWorld, worldData: IWorldData} = JSON.parse(pako.inflate(atob(base64)));

	let name = obj.worldInfo.name;
	let num = 0;

	while (takenNames.includes(name)) {
		num++;
		name = obj.worldInfo.name + '(' + num + ')';
	}

	await saveWorld(name, obj.worldData.data, obj.worldInfo.settings);

	return name;
}
