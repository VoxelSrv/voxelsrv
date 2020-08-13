const protobuf = require("protobufjs")
const EventEmitter = require('events')

const eventServer = new EventEmitter()
const eventClient = new EventEmitter()

const serverDesc = require('./protocol/server.json')
const clientDesc = require('./protocol/client.json')

const server = protobuf.Root.fromJSON(serverDesc)
const client = protobuf.Root.fromJSON(clientDesc)

function reverse(obj) {
	var x = {}
	var array = Object.entries(obj)
	array.forEach( (y) => { x[ y[1] ] = y[0] } )
	return x
}



var serverIDtoName = {...Object.keys(serverDesc.nested)}
var serverNameToID = reverse(serverIDtoName)

var clientIDtoName = {...Object.keys(clientDesc.nested)}
var clientNameToID = reverse(clientIDtoName)


function parseToObject(pType, data) {
	if (pType == 'server') {
		var type = serverIDtoName[ data[0] ]
		var packet = server.lookupType(type)
	} else {
		var type = clientIDtoName[ data[0] ]
		var packet = client.lookupType(type)
	}

	var rawData = data.slice(1)

	var message = packet.decode(rawData)

	var error = packet.verify(message)

	if (error) { 
		console.error('Invalid server packet! Type: ' + type, error )
		return null
	}

	return {data: packet.toObject(message), type: type}
}

function parseToMessage(pType, type, data) {
	if (pType == 'server') {
		var typeRaw = serverNameToID[ type ]
		var packet = server.lookupType(type)
	} else {
		var typeRaw = clientNameToID[ type ]
		var packet = client.lookupType(type)
	}

	var error = packet.verify(data)

	if (error) { 
		console.error('Invalid client packet! Type: ' + type, error )
		return null
	}	

	var encoded = packet.encode(data)

	var message = new Uint8Array( [typeRaw].concat(encoded) )

	return message
}

module.exports = {
	server,
	serverIDtoName,
	serverNameToID,
	eventServer,

	client,
	clientIDtoName,
	clientNameToID,
	eventClient,

	parseToObject,
	parseToMessage
}