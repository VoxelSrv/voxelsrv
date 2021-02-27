import { ProtoDef, Serializer, Parser } from 'protodef';
import { get, merge } from 'lodash';
import * as minecraft from '../datatypes/minecraft';

import packets from '../protocol.json';

function recursiveAddTypes(protocol, protocolData, path) {
	if (protocolData === undefined) return;

	if (protocolData.types) protocol.addTypes(protocolData.types);

	recursiveAddTypes(protocol, get(protocolData, path.shift()), path);
}

function createProtocol(customPackets, direction) {
	var proto = new ProtoDef();
	proto.addTypes(minecraft);
	recursiveAddTypes(proto, merge(packets, customPackets), [direction]);
	return proto;
}

export function createSerializer(isServer = false, customPackets) {
	return new Serializer(createProtocol(customPackets, !isServer ? 'toServer' : 'toClient'), 'packet');
}

export function createDeserializer(isServer = false, customPackets) {
	return new Parser(createProtocol(customPackets, isServer ? 'toServer' : 'toClient'), 'packet');
}
