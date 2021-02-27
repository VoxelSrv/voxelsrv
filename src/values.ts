import { saveSettings } from './lib/helpers/storage';
import { isMobile, isFirefox } from 'mobile-device-detect';
import { setScale } from './gui/main';
import { IFormatedText } from './gui/parts/formtextblock';
import { IServerInfo } from './gui/menu/multiplayer';

export const gameVersion = '0.2.0-beta.17.1';

export const gameProtocol = 3;

export const heartbeatServer = 'https://voxelsrv.pb4.eu';
export const proxyServer = 'wss://pb4.eu:9001';

export const defaultSettings: IGameSettings = {
	version: '0.0.0',
	nickname: `Player${Math.round(Math.random() * 100000)}`,
	autostep: isMobile,
	gamepad: false,
	singleplayer: false,
	allowcustom: false,
	mouse: isMobile ? 50 : 15,
	viewDistance: isMobile ? 3 : isFirefox ? 2 : 5,
	hotbarsize: 9,
	scale: 3,
	fov: 70,
	fpslimit: 0,
	debugInfo: false,
	showFPS: false,
	autoSaveInterval: 300,
	controls: {
		forward: 'W',
		left: 'A',
		backward: 'S',
		right: 'D',
		fire: '<mouse 1>',
		'mid-fire': '<mouse 2>',
		'alt-fire': '<mouse 3>',
		jump: '<space>',
		inventory: 'E',
		thirdprsn: 'M',
		chatenter: '<enter>',
		chat: 'T',
		cmd: '/',
		tab: '`',
		menu: '<escape>',
		screenshot: 'P',
		hide: 'O',
		zoom: 'Z',
	},
};

export let gameSettings: IGameSettings = { ...defaultSettings, version: gameVersion };

export interface IGameSettings {
	version: string;
	nickname: string;
	autostep: boolean;
	gamepad: boolean;
	singleplayer: boolean;
	allowcustom: boolean;
	mouse: number;
	viewDistance: number;
	hotbarsize: number;
	scale: number;
	fov: number;
	fpslimit: number;
	debugInfo: boolean;
	showFPS: boolean;
	autoSaveInterval: number
	controls: { [i: string]: string };
}

export interface IWorldSettings {
	gamemode: 'creative';
	worldsize: number;
	generator: string;
	version: number;
	seed: number;
	gameVersion: string;
	serverVersion: string;
	displayName?: string
	icon?: string
}

export function updateSettings(data: Object) {
	gameSettings = { ...defaultSettings, ...data };
	setScale(gameSettings.scale);
	saveSettings(gameSettings);
}

export const defaultServerSettings = {
	cheats: false,
	control: false,
	ingame: false,
};

export let serverSettings = { ...defaultServerSettings };

export function updateServerSettings(data: Object) {
	serverSettings = { ...serverSettings, ...data };
}

export const defaultValues = {
	fogMode: 3,
	fogStart: 500,
	fogEnd: 4000,
	fogDensity: 0.000001,
	fogColor: [0.8, 0.9, 1],
	blockTestDistance: 7,
	clearColor: [0.8, 0.9, 1],
	skyColor:[0.2, 0.3, 0.7],
	backgroundColor: '#00000077',
	menuColor: '#11111177',
};

export function noaOpts() {
	return {
		debug: true,
		showFPS: false,
		inverseY: false,
		inverseX: false,
		sensitivityX: gameSettings.mouse,
		sensitivityY: gameSettings.mouse,
		chunkSize: 32, // Don't touch this
		chunkAddDistance: gameSettings.viewDistance,
		chunkRemoveDistance: gameSettings.viewDistance,
		blockTestDistance: defaultValues.blockTestDistance,
		tickRate: 20,
		texturePath: '',
		playerStart: [0, 100, 0],
		playerHeight: 1.85,
		playerWidth: 0.6,
		playerAutoStep: gameSettings.autostep ? 1 : 0,
		clearColor: defaultValues.clearColor,
		ambientColor: [1, 1, 1],
		lightDiffuse: [1, 1, 1],
		lightSpecular: [1, 1, 1],
		groundLightColor: [1, 1, 1],
		useAO: true,
		AOmultipliers: [0.93, 0.8, 0.5],
		reverseAOmultiplier: 1.0,
		preserveDrawingBuffer: true,
		stickyPointerLock: false,
		adaptToDeviceRatio: false,
		gravity: [0, -14, 0],
		bindings: {}, // Bindings are now stored in settings
		tickInUnloadedChunks: true,
		ignorePointerLock: false,
		manuallyControlChunkLoading: true,
	};
}

export const defaultFonts = [
	'silkscreen',
	'Lato',
	'Lato-Italic',
	'Lato-Black',
	'Lato-BlackItalic',
	'Lato-Bold',
	'Lato-BoldItalic',
	'Lato-Light',
	'Lato-LightItalic',
	'Lato-Thin',
	'Lato-ThinItalic',
	'PixelOperator-Bold',
	'PixelOperator',
	'PixelOperator8-Bold',
	'PixelOperator8',
	'PixelOperatorHB',
	'PixelOperatorHB8',
	'PixelOperatorHBSC',
	'PixelOperatorMono-Bold',
	'PixelOperatorMono',
	'PixelOperatorMono8-Bold',
	'PixelOperatorMono8',
	'PixelOperatorMonoHB',
	'PixelOperatorMonoHB8',
	'PixelOperatorSC-Bold',
	'PixelOperatorSC',
];

export let noa = null;
export function setNoa(x) {
	noa = x;
}

let tempHost = '???';
export const hostname = window.location.hostname;
export const parms = new URLSearchParams(window.location.search);

if (hostname == '0.0.0.0' || hostname == 'localhost') tempHost = 'Localhost/DEV';
else if (hostname == 'voxelsrv-master.pb4.eu') tempHost = 'Development';
else if (hostname == 'voxelsrv.pb4.eu') tempHost = '';
else if (hostname == 'pb4.eu') tempHost = '';
else if (hostname == 'pb4.eu') tempHost = '';
else if (hostname == 'www.newgrounds.com' || hostname == 'uploads.ungrounded.net') tempHost = 'Newgrounds'
else if (window['electron'] != undefined) tempHost = '';
else tempHost = 'Unofficial/Undefined rehost!';

export let hostedOn = tempHost;

const splashes: IFormatedText[][] = [
	[{ text: `It's not Minecraft clone... or is it?` }],
	[{ text: `Written in Typescript` }],
	[{ text: `Powered by Noa Engine` }],
	[{ text: `Open Source` }],
	[{ text: `Multiplayer supported!` }],
	[{ text: `You can fork it!` }],
	[{ text: `Available on github` }],
	[{ text: `Bottom text` }],
	[{ text: `Pixelated`, font: 'PixelOperator-Bold' }],
	[{ text: `In development` }],
	[{ text: `404: File not found` }],
	[{ text: `:concern:` }],
	[{ text: `[🥔]` }],
	[{ text: `Works in browser` }],
	[{ text: `youtu.be/dQw4w9WgXcQ` }],
	[{ text: `Do not do it` }],
	[{ text: `discord.gg/K9PdsDh` }],
	[{ text: `Not for sale` }],
	[{ text: `Includes bugs` }],
	[{ text: `Checkout on github!` }],
	[{ text: `+ 5 new DLC characters` }],
	[{ text: `TODO: Add accounts` }],
	[{ text: `Does anyone read these?` }],
	[{ text: `Created by Patbox` }],
	[{ text: `Classical gameplay` }],
	[{ text: `Hello World` }],
	[{ text: `Works on mobile` }],
	[{ text: gameVersion }],
	[{ text: `PixelPerfection!` }],
	[{ text: `Singleplayer supported!` }],
	[{ text: `Since 2020` }],
];

if (new Date().getDay() == 3) {
	splashes.push([{ text: 'It Is Wednesday My Dudes'}])
}


export function getSplash() {
	let x = Math.floor(Math.random() * splashes.length);
	return splashes[x];
}

export const aboutText = [
	{ text: 'Created by: ' },
	{ text: 'Patbox', url: 'https://github.com/Patbox', color: 'lightblue' },
	{ text: '\nBuild on top of ' },
	{ text: 'Noa Engine by Andy Hall', color: 'lightblue', url: 'https://github.com/andyhall/noa' },
	{ text: '\nUsed textures: ' },
	{ text: 'PixelPerfection', color: 'lightblue', url: 'https://github.com/Athemis/PixelPerfectionCE' },
	{ text: ' by XSSheep and others' },
	{ text: '\n\n\n' },
	{ text: 'MC Classic support is based on work by ' },
	{ text: 'rom1504 and mhsjlw', color: 'lightblue', url: 'https://github.com/mhsjlw/minecraft-classic-protocol' },
	{ text: '\nClassic server list is provided by ' },
	{ text: "MineOnline", color: 'lightblue', url: 'https://mineonline.codie.gg/servers' },
];

export const singleplayerServerInfo: IServerInfo = {
	name: 'Singleplayer World',
	ip: 'Internal',
	motd: '',
	protocol: gameProtocol,
	software: 'VoxelSrv',
	featured: true,
	icon: 'voxelsrv',
	type: 0,
	players: {
		max: 1,
		online: 0,
	},
	useProxy: false,
}

export const singleplayerWorldTypes = ['normal', 'flat']
