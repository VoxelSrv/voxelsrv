import * as client from 'voxelsrv-protocol/js/client';
import * as server from 'voxelsrv-protocol/js/server';
import { default as mapClient } from 'voxelsrv-protocol/idmap/client.json';
import { default as mapServer } from 'voxelsrv-protocol/idmap/server.json';

let revMapServer = {};
let revMapClient = {};

mapClient.forEach((x, i) => (revMapClient[x] = i));
mapServer.forEach((x, i) => (revMapServer[x] = i));

export function parseToObject(pType, data) {
	let type = '';
	let packet: any;
	if (pType == 'server') {
		type = mapServer[data[0]];
		if (type == undefined) return null;
		packet = server[type];
	} else {
		type = mapClient[data[0]];
		if (type == undefined) return null;
		packet = client[type];
		pType = 'client';
	}

	const rawData = data.slice(1);

	const message = packet.decode(rawData);

	let error: string | null = null;

	if (packet != undefined) error = packet.verify(message);
	else error = 'Invalid packet';

	if (error) {
		console.error('Invalid ' + pType + ' packet! Type: ' + type, error);
		return null;
	}

	return { data: packet.toObject(message), type: type };
}

export function parseToMessage(pType, type, data) {
	let packet: any;
	let typeRaw: number = 0;
	if (pType == 'server') {
		typeRaw = revMapServer[type];
		if (typeRaw == undefined) return null;
		packet = server[type];
	} else {
		typeRaw = revMapClient[type];
		if (typeRaw == undefined) return null;
		packet = client[type];
		pType = 'client';
	}

	let error: string | null = null;

	if (packet != undefined) error = packet.verify(data);
	else error = 'Invalid packet';

	if (error) {
		console.error('Invalid ' + pType + ' packet! Type: ' + type, data, error);
		return null;
	}

	const message = packet.create(data);
	const encoded = packet.encode(message).finish();

	const out = new Uint8Array(1 + encoded.length);
	out.set([typeRaw]);
	out.set(encoded, 1);

	return out.buffer;
}
