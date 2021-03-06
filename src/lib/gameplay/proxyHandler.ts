import { ILoginResponse } from 'voxelsrv-protocol/js/client';
import { IAuthRequest } from 'voxelsrv-protocol/js/proxy-client';
import { IAuthResponce, IProxyInfo } from 'voxelsrv-protocol/js/proxy-server';

import { proxyVersion } from 'voxelsrv-protocol/const.json';
import { ProxySocket } from '../../socket';
import connectToClassic30Server from '../../protocolWrappers/0.30c/socket';
import { ILoginRequest } from 'voxelsrv-protocol/js/server';
import { gameProtocol } from '../../values';

export class ProxyHandler {
	server: string;
	socket: ProxySocket;
	loginData: ILoginResponse;

	clientListeners: Object = {};
	serverListener: (x: ArrayBuffer) => any = () => {};
	ready: () => any = () => {};

	constructor(server: string) {
		this.server = server;
	}

	setSocket(s: ProxySocket) {
		this.socket = s;
	}

	async receiveServerMessage(type: string, data: any) {
		switch (type) {
			case 'ProxyInfo':
				const unmapped: IProxyInfo = data;
				const remapped: ILoginRequest = {
					name: unmapped.name,
					protocol: gameProtocol,
					onlinePlayers: unmapped.onlinePlayers,
					maxPlayers: unmapped.maxPlayers,
					motd: unmapped.motd,
					software: unmapped.software,
					auth: unmapped.auth,
					secret: unmapped.secret,
				};
				this.socket.receive('LoginRequest', remapped);
				break;
			case 'AuthResponce':
				this.setup(data);
				break;
			case 'VoxelSrvMessage':
				const packet = await this.socket.protocol.parseToObject('server', new Uint8Array(data));
				if (packet != null) {
					this.socket.receive(packet.type, packet.data);
				}
				break;
			case 'Disconnect':
				this.socket.receive('PlayerKick', { reason: data.reason });
				this.socket.close();
				break;
			case 'Data':
				this.serverListener(data.message)
				break;
			}
	}

	receiveClientMessage(type: string, data: any) {
		switch (type) {
			case 'LoginResponse':
				const lr: ILoginResponse = data;
				this.loginData = lr;
				const out: IAuthRequest = {
					username: lr.username,
					protocol: lr.protocol,
					client: lr.client,
					uuid: lr.uuid,
					secret: lr.secret,
					serverId: this.server,
					proxySupportedVersion: proxyVersion,
				};

				this.socket.sendProxy('AuthRequest', out);
				break;
			default:
				this.emitClient(type, data);
		}
	}

	setup(data: IAuthResponce) {
		if (data.usePacketTranslation) {
			if (data.type == 'mc0.30c') {
				connectToClassic30Server(this);
			} else {
				this.socket.receive('PlayerKick', {reason: `Unsupported protocol translation: ${data.type}`})
				this.socket.close();
			}
		} else {
			this.serverListener = async (data) => {
				const packet = await this.socket.protocol.parseToObject('server', new Uint8Array(data));
				if (packet != null) {
					this.socket.receive(packet.type, packet.data);
				}
			};
		}

		this.socket.sendReady();
		setTimeout(() => this.ready(), 100);
	}

	protected emitClient(type, data) {
		if (this.clientListeners[type] != undefined) {
			this.clientListeners[type].forEach((func) => {
				func(data);
			});
		}
	}

	onClient(type: string, func: (data: any) => void) {
		if (this.clientListeners[type] != undefined) {
			this.clientListeners[type].push(func);
		} else {
			this.clientListeners[type] = new Array();
			this.clientListeners[type].push(func);
		}
	}
}
