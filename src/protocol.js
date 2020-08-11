var protobuf = require("protobufjs")

const serverDesc = require('./protocol/server.json')
const clientDesc = require('./protocol/client.json')

const server = protobuf.Root.fromJSON(serverDesc)
const client = protobuf.Root.fromJSON(clientDesc)


module.exports = {
	server,
	client
}


