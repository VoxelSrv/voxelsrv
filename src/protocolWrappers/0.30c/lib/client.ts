import { EventEmitter } from 'events';
import type { Serializer, Deserializer } from 'protodef';

import { createDeserializer, createSerializer } from './transforms/serializer';

export class Client extends EventEmitter {
	serializer: Serializer;
	deserializer: Deserializer;
	isServer = false;
	customPackets;

	constructor() {
		super();
		this.customPackets = {};

		this.serializer = createSerializer(false, this.customPackets);
		this.deserializer = createDeserializer(false, this.customPackets);

		this.serializer.on('error', (e) => {
			var parts = e.field ? e.field.split('.') : [];
			parts.shift();
			var serializerDirection = !this.isServer ? 'toServer' : 'toClient';
			e.field = [serializerDirection].concat(parts).join('.');
			e.message = `Serialization error for ${e.field} : ${e.message}`;
			this.emit('error', e);
		});

		this.deserializer.on('error', (e) => {
			var parts = e.field ? e.field.split('.') : [];
			parts.shift();
			var deserializerDirection = this.isServer ? 'toServer' : 'toClient';
			e.field = [deserializerDirection].concat(parts).join('.');
			e.message = `Deserialization error for ${e.field} : ${e.message}`;
			this.emit('error', e);
		});

		this.deserializer.on('data', (parsed) => {
			parsed.metadata.name = parsed.data.name;
			parsed.data = parsed.data.params;
			this.emit('packet', parsed.data, parsed.metadata);

			this.emit(parsed.metadata.name, parsed.data, parsed.metadata);
			this.emit('raw.' + parsed.metadata.name, parsed.buffer, parsed.metadata);
			this.emit('raw', parsed.buffer, parsed.metadata);
		});
	}

	send(type, data) {
		this.emit('send', {
			name: type,
			params: data,
		});
		/*this.serializer.write({
			name: type,
			params: data,
		});*/
	}
}
