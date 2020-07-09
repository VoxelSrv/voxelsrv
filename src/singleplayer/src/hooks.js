
var hooks = {}

function createHook(name, size) {
	hooks[name] = new Array(size)
	for (var x = 0; x < hooks[name].length; x++ ) {
		hooks[name][x] = [] 
	}
	return name
}

function executeHook(name, data) {
	var r = 0
	if (hooks[name] != undefined) {
		for (var x = 0; x < hooks[name].length; x++ ) {
			for (var y = 0; y < hooks[name][x].length; y++ ) {
				r = hooks[name][x][y](name, data)
				if (r == 1) {
					return r
				}
			}
		}
	} else { 
		r = 1
		return r 
	}
}

function addToHook(name, priority, func) {
	if (hooks[name] != undefined) {
		if (hooks[name][priority] != undefined) {
			hooks[name][priority].push(func)
		} else return false
	} else return false
}


module.exports = {
	create: createHook,
	execute: executeHook,
	add: addToHook
}