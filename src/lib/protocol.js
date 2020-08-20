const protobuf = require("protobufjs")
const EventEmitter = require('events')

const eventServer = new EventEmitter()
const eventClient = new EventEmitter()

const serverDesc = require('voxelsrv-protocol/json/server.json')
const clientDesc = require('voxelsrv-protocol/json/client.json')

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
		if (type == undefined) return null
		var packet = server.lookupType(type)
	} else {
		var type = clientIDtoName[ data[0] ]
		if (type == undefined) return null
		var packet = client.lookupType(type)
		pType = 'client'
	}

	var rawData = data.slice(1)

	var message = packet.decode(rawData)

	if (packet != undefined) var error = packet.verify(message)
	else var error = 'Invalid packet'
	
	if (error) { 
		console.error('Invalid ' + pType + ' packet! Type: ' + type, error )
		return null
	}

	return {data: packet.toObject(message), type: type}
}

function parseToMessage(pType, type, data) {
	if (pType == 'server') {
		var typeRaw = serverNameToID[ type ]
		if (typeRaw == undefined) return null
		var packet = server.lookupType(type)
	} else {
		var typeRaw = clientNameToID[ type ]
		if (typeRaw == undefined) return null
		var packet = client.lookupType(type)
		pType = 'client'
	}

	if (packet != undefined) var error = packet.verify(data)
	else var error = 'Invalid packet'


	if (error) { 
		console.error('Invalid ' + pType + ' packet! Type: ' + type, data, error )
		return null
	}	

	var message = packet.create(data)
	var encoded = packet.encode(message).finish()


	var out = new Uint8Array(1 + encoded.length)
	out.set([typeRaw])
	out.set(encoded, 1)

	return out.buffer
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