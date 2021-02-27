const PartialReadError = require('protodef').utils.PartialReadError;

function readString(buffer, offset) {
	if (offset + 64 > buffer.length) throw new PartialReadError();
	var value = buffer.toString('ascii', offset, offset + 64);
	value = value.trim();
	return {
		value: value,
		size: 64,
	};
}

function writeString(value, buffer, offset) {
	for (var i = value.length - 1; i < 64; i++) value += ' ';
	buffer.write(value, offset, 64, 'ascii');
	return offset + 64;
}

function readByteArray(buffer, offset) {
	var countResults = this.read(buffer, offset, 'i16');
	offset += 2;

	if (offset + 1024 > buffer.length) throw new PartialReadError();

	return {
		value: buffer.slice(offset, offset + countResults.value),
		size: 2 + 1024,
	};
}

function writeByteArray(value, buffer, offset) {
	offset = this.write(value.length, buffer, offset, 'i16');
	offset += value.copy(buffer, offset);
	var buf = Buffer.alloc(1024 - value.length);
	buf.fill(0);
	offset += buf.copy(buffer, offset);
	return offset;
}

function sizeOfByteArray() {
	return 2 + 1024;
}

export const string = [readString, writeString, 64];
export const byte_array = [readByteArray, writeByteArray, sizeOfByteArray];
