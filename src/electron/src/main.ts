import { ipcMain, app, shell } from 'electron';
import { spawn, Thread, Worker } from 'threads';

import { serverDefaultConfig } from 'voxelsrv-server/dist/values';

import * as fs from 'fs';
import sanitaze from 'sanitize-filename';

const working = process.cwd();

const mainFolder = `${app.getPath('documents')}/voxelsrv`;
if (!fs.existsSync(mainFolder)) fs.mkdirSync(mainFolder);

if (!fs.existsSync(`${mainFolder}/worlds/`)) fs.mkdirSync(`${mainFolder}/worlds/`);

let active = false;

function getWorldList() {
	const returnData: Array<any> = [];

	fs.readdirSync(`${mainFolder}/worlds/`).forEach((x) => {
		if (fs.statSync(`${mainFolder}/worlds/${x}`).isDirectory() && fs.existsSync(`${mainFolder}/worlds/${x}/data.json`)) {
			try {
				const data = fs.readFileSync(`${mainFolder}/worlds/${x}/data.json`);
				const json = JSON.parse(data.toString());

				if (json.voxelsrv != undefined) {
					returnData.push({
						name: !!json.name ? json.name : x,
						date: !!json.date ? json.date : Date.now(),
						type: !!json.type ? json.type : '[Corrupted!]',
						rawName: x,
					});
				}
			} catch (e) {}
		}
	});

	return returnData;
}

ipcMain.on('world-list-request', (e) => {
	e.reply('world-list', getWorldList());
});

ipcMain.on('world-start', async (e, data) => {
	const world = await spawn(new Worker(`world`));

	process.chdir(`${mainFolder}/worlds/${data.world}`);

	const port = await world.start(`${mainFolder}/worlds/${data.world}`);
	active = true;

	setTimeout(() => {
		e.reply('world-started', port);
	}, 1000);
});

ipcMain.on('world-create', async (e, data) => {
	const safe = sanitaze(data.world)
	let name = safe;
	let x = 0;
	while (fs.existsSync(`${mainFolder}/worlds/${name}`)) {
		x = x + 1;
		name = `${safe}-${x}`;
	}

	fs.mkdirSync(`${mainFolder}/worlds/${name}`, { recursive: true });
	fs.mkdirSync(`${mainFolder}/worlds/${name}/config`, { recursive: true });

	const world = await spawn(new Worker(`world`));

	fs.writeFileSync(`${mainFolder}/worlds/${name}/data.json`, JSON.stringify(data.data));
	fs.writeFileSync(`${mainFolder}/worlds/${name}/config/config.json`, JSON.stringify({ ...serverDefaultConfig, ...data.config }));

	process.chdir(`${mainFolder}/worlds/${name}`);

	const port = await world.start(`${mainFolder}/worlds/${name}`);
	active = true;

	setTimeout(() => {
		e.reply('world-started', port);
	}, 1000);
});

ipcMain.on('world-delete', async (e, data) => {
	fs.rmdirSync(`${mainFolder}/worlds/${data.world}`);

	e.reply('world-list', getWorldList());
});
