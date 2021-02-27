/*
 * Storage helper
 */

import Dexie from 'dexie';
import { IWorldSettings, noa } from '../../values';

export interface IMain {
	name: string;
	data: any;
}

export interface IResources {
	name: string;
	data: any;
}

export interface IWorld {
	name: string;
	settings: IWorldSettings;
	lastplay: number;
}

export interface IWorldData {
	name: string;
	data: object;
}

class Database extends Dexie {
	main: Dexie.Table<IMain, string>;
	resources: Dexie.Table<IResources, string>;
	world: Dexie.Table<IWorld, string>;
	worlddata: Dexie.Table<IWorldData, string>;

	constructor() {
		super('voxelsrv-storage');
		this.version(1).stores({
			main: `name, data`,
			resources: `name, data, active`
		})

		this.version(2).stores({
			main: `name, data`,
			resources: `name, data, active`,
			world: `name, settings, lastplay`,
			worlddata: `name, data`
		});
	}
}

export const db = new Database();

export async function getWorldList() {
	return await db.world.orderBy('lastplay').reverse().toArray();
}

export async function saveWorld(name: string, data: object, settings: IWorldSettings) {
	await db.world.delete(name);
	await db.worlddata.delete(name);
	await db.world.add({name, settings, lastplay: Date.now()}, name)
	await db.worlddata.add({name, data}, name)
}

export async function updateWorldSetting(name: string, settings: IWorldSettings, lastPlay: number) {
	await db.world.delete(name);
	await db.world.add({name, settings, lastplay: lastPlay}, name)
}

export async function deleteWorld(name: string) {
	await db.world.delete(name);
	db.worlddata.delete(name);
}

export async function getWorld(name: string): Promise<IWorld> {
	const world = db.world.where('name').equals(name).first();
	return world;
}

export async function getWorldData(name: string): Promise<IWorldData> {
	const world = db.worlddata.where('name').equals(name).first();
	return world;
}

export async function getSettings(): Promise<object> {
	const x = (await db.main.where('name').equals('settings').toArray())[0];
	if (x != undefined) return x.data;
	return {};
}

export async function saveSettings(data) {
	db.main.put({ name: 'settings', data: data });
}
