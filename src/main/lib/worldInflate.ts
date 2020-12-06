import { expose } from 'threads/worker';
import * as pako from 'pako';

expose(function (data, size) {
	return pako.inflate(data, new Uint16Array(size));
});

self['rootWindow'] = { location: { reload() {} } };
