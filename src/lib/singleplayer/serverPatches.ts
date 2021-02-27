import { Server } from 'voxelsrv-server/dist/server';

export default function () {
	Server.prototype.heartbeatPing = function() {}
	Server.prototype.authenticatePlayer = async function(params) {
		return null;
	}
}