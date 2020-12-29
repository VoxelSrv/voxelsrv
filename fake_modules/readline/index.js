const EventEmitter = require('events').EventEmitter;

module.exports = {
	createInterface: (data) => {
		return new EventEmitter();
	},
};
