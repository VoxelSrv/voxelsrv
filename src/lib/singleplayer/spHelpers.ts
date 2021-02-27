import JSZip from 'jszip';
import { getWorld, getWorldData, getWorldList, saveWorld } from '../helpers/storage';
import { gameVersion, IWorldSettings, singleplayerWorldTypes } from '../../values';
import { IServerConfig, serverVersion } from 'voxelsrv-server/dist/values';

export async function exportWorldAsZip(worldname: string, updateCallback: (x) => void): Promise<Blob> {
	updateCallback(`Loading world...`);

	const worldInfo = await getWorld(worldname);
	const worldData = await getWorldData(worldname);

	const zip = new JSZip();

	const size = Object.keys(worldData.data).length;
	let x = 0;

	for (const path in worldData.data) {
		x++;
		updateCallback(`Converting world... ${((x / size) * 100).toFixed(0)}%`);
		if (path.endsWith('.chk')) {
			const base64Chunk = worldData.data[path];
			zip.file(
				path,
				Uint8Array.from(atob(base64Chunk), (c) => c.charCodeAt(0))
			);
		} else {
			zip.file(path, worldData.data[path]);
		}
	}

	zip.file('spWorldSettings.json', JSON.stringify(worldInfo.settings));

	const blob = await zip.generateAsync(
		{
			type: 'blob',
			compression: 'DEFLATE',
			compressionOptions: {
				level: 9,
			},
		},
		(val) => {
			updateCallback(`Compressing... ${val.percent.toFixed(0)}%`);
		}
	);

	updateCallback(`Done`);

	return blob;
}

export async function importWorldFromZip(blob: Blob, updateCallback: (x, y?) => void): Promise<string> {
	updateCallback(`Preparing...`);

	const worlds = await getWorldList();

	const takenNames = [];

	worlds.forEach((w) => {
		takenNames.push(w.name);
	});

	const worldJSON = {};

	const zip = await new JSZip().loadAsync(blob);

	const size = Object.keys(zip.files).length;
	let x = 0;

	let settings: IWorldSettings = null;
	if (zip.files['spWorldSettings.json'] != null) {
		updateCallback(`Preparing settings...`);
		settings = JSON.parse(await zip.files['spWorldSettings.json'].async('string'));
		updateCallback(`Preparing settings...`, settings.displayName);
	}

	for (const path in zip.files) {
		x++;
		if (path.endsWith('.json')) {
			const data = await zip.files[path].async('string');
			worldJSON[path] = data;
		} else if (path.endsWith('.chk')) {
			worldJSON[path] = await zip.files[path].async('base64');
		}
		updateCallback(`Decompressing... ${((x / size) * 100).toFixed(0)}%`);
	}

	if (worldJSON['spWorldSettings.json'] != undefined) {
		delete worldJSON['spWorldSettings.json'];
	} else {
		updateCallback(`Recreating settings...`, 'Imported world');
		const serverConfig: IServerConfig = JSON.parse(worldJSON['configs/config.json']);
		settings = {
			gamemode: 'creative',
			worldsize: serverConfig.world.border,
			generator: serverConfig.world.generator,
			version: 0,
			gameVersion: gameVersion,
			serverVersion: serverVersion,
			seed: serverConfig.world.seed,
		};
	}

	const baseName = settings.displayName != undefined ? settings.displayName : 'Imported world';
	let name = baseName;
	let num = 0;

	while (takenNames.includes(name)) {
		num++;
		name = baseName + '(' + num + ')';
	}

	updateCallback(`Saving...`);
	await saveWorld(name, worldJSON, settings);
	updateCallback(`Done`);

	return name;
}
