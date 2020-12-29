/*
 * Wrap protocol in worker
 */

import { expose } from 'threads/worker';
import { parseToMessage, parseToObject } from 'voxelsrv-protocol';

expose({
	parseToMessage,
	parseToObject,
});

self['rootWindow'] = { location: { reload() {} } };
