/*
 * Storage helper
 */

import Dexie from 'dexie';

interface IMain {
	name: string;
	data: any;
}

interface IResources {
	name: string;
	data: any;
}

interface IWorlds {
	name: string;
	data: any;
}

class Database extends Dexie {
	main: Dexie.Table<IMain, string>;
	resources: Dexie.Table<IResources, string>;
	worlds: Dexie.Table<IWorlds, string>;

	constructor() {
		super('voxelsrv-storage');
		this.version(1).stores({
			main: `name, data`,
			resources: `name, data, active`,
			worlds: `name, data, settings, lastplay`,
		});
	}
}

export const db = new Database();

export async function getWorldList() {
	return await db.worlds.orderBy('lastplay').toArray();
}

export async function getSettings(): Promise<object> {
	const x = (await db.main.where('name').equals('settings').toArray())[0];
	console.log(x);
	if (x != undefined) return x.data;
	return {};
}

export async function saveSettings(data) {
	db.main.put({ name: 'settings', data: data });
}
