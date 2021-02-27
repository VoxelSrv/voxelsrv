import { scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { FormTextBlock } from '../parts/formtextblock';
import { connect } from '../../lib/gameplay/connect';
import { Vector2 } from '@babylonjs/core';
import { createItem } from '../parts/menu';
import { defaultValues, heartbeatServer } from '../../values';

export let servers = {};

export interface IServerInfo {
	name: string;
	ip: string;
	motd: string;
	protocol: number;
	players: {
		online: number;
		max: number;
	};
	type: number;
	software: string;
	useProxy: boolean;
	featured: boolean;
	icon: string;
	compabilityLayer?: string;
}

export default function buildMultiplayer(noa, openMenu) {
	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
	else menu.height = `100%`;
	menu.width = `${310 * scale}px`;
	menu.background = defaultValues.menuColor;

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 13 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Multiplayer';
	name.top = scale;

	menu.addControl(name);

	const input = new GUI.InputText();

	input.height = `${17 * scale}px`;
	input.width = `${266 * scale}px`;
	input.top = `${18 * scale}px`;
	input.left = `${5 * scale}px`;
	input.fontSize = 6 * scale;
	input.verticalAlignment = 0;
	input.horizontalAlignment = 0;
	input.thickness = 0;
	input.background = '#ffffffaa';
	input.focusedBackground = '#ffffffff';
	input.color = '#666666';
	input.placeholderText = 'Server address';

	menu.addControl(input);

	const button = new GUI.Rectangle();
	button.height = `${17 * scale}px`;
	button.width = `${34 * scale}px`;
	button.top = `${18 * scale}px`;
	button.left = `${-5 * scale}px`;
	button.verticalAlignment = 0;
	button.horizontalAlignment = 1;
	button.thickness = 0;
	button.background = '#4d4d4daa';
	button.color = '#666666';

	button.onPointerClickObservable.add(() => {
		if (input.text == '') return;

		connect(noa, input.text);
	});

	const buttontext = new FormTextBlock();
	buttontext.text = [{ text: 'Connect', color: 'white', font: 'Lato' }];
	buttontext.textHorizontalAlignment = 2;
	buttontext.fontSize = 6 * scale;
	button.onPointerEnterObservable.add((e) => {
		buttontext.text.forEach((x) => (x.underline = true));
		buttontext._markAsDirty();
		button.background = '#5d5d5daa';
	});

	button.onPointerOutObservable.add((e) => {
		buttontext.text.forEach((x) => (x.underline = false));
		buttontext._markAsDirty();
		button.background = '#4d4d4daa';
	});
	button.addControl(buttontext);

	menu.addControl(button);

	const serverListContainer = new GUI.Rectangle();
	serverListContainer.width = `${290 * scale}px`;
	serverListContainer.height = '70%';
	serverListContainer.verticalAlignment = 0;
	serverListContainer.top = `${40 * scale}px`;
	serverListContainer.background = '#ffffffbb';
	serverListContainer.thickness = 0;

	const serverListHeader = createRow();
	serverListHeader.main.verticalAlignment = 0;
	serverListHeader.main.fontFamily = 'Lato';
	serverListHeader.main.background = '#88888855';
	serverListHeader.main.fontSize = 7 * scale;

	const hname = new GUI.TextBlock();
	hname.text = 'Name';
	hname.color = '#222222';
	serverListHeader.name.addControl(hname);

	const hmotd = new GUI.TextBlock();
	hmotd.text = 'Motd';
	hmotd.color = '#222222';
	serverListHeader.motd.addControl(hmotd);

	const hplayer = new GUI.TextBlock();
	hplayer.text = `Players`;
	hplayer.color = '#222222';
	serverListHeader.players.addControl(hplayer);

	const hsoftware = new GUI.TextBlock();
	hsoftware.text = 'Software';
	hsoftware.color = '#222222';
	serverListHeader.software.addControl(hsoftware);

	serverListContainer.addControl(serverListHeader.main);

	menu.addControl(serverListContainer);

	const serverListScroll = new GUI.ScrollViewer();
	serverListScroll.height = `${150 * scale}px`;
	serverListScroll.top = `${16 * scale}px`;
	serverListScroll.thickness = 0;
	serverListScroll.verticalAlignment = 0;
	serverListScroll.barSize = 0;
	serverListContainer.addControl(serverListScroll);

	const serverList = new GUI.StackPanel();
	serverList.fontFamily = 'Lato';
	serverList.width = '100%';
	serverList.fontSize = 6 * scale;
	serverList.verticalAlignment = 0;

	serverListScroll.addControl(serverList);

	function updateList() {
		serverList.children.forEach((x) => {
			x.dispose();
		});
		serverList.clearControls();

		fetch(heartbeatServer + '/api/servers')
			.then((response) => response.json())
			.then((data: any) => {
				servers = data;
				const array = Object.values(data);
				array.sort(sortServerList);

				array.forEach((server: IServerInfo) => {
					if (location.protocol == 'https:' && !server.useProxy && !server.ip.startsWith('wss://') ) {
						return;
					}

					const row = createRow();

					row.icon.source = './servericons/' + server.icon + '.png';

					const sname = new GUI.TextBlock();
					sname.text = server.name;
					sname.color = '#222222';
					row.name.addControl(sname);

					const smotd = new GUI.TextBlock();
					smotd.text = server.motd;
					smotd.color = '#222222';
					row.motd.addControl(smotd);

					const splayer = new GUI.TextBlock();
					splayer.text = `${server.players.online}/${server.players.max}`;
					splayer.color = '#222222';
					row.players.addControl(splayer);

					const ssoftware = new GUI.TextBlock();
					ssoftware.text = server.software;
					ssoftware.color = '#222222';
					row.software.addControl(ssoftware);

					row.main.background = server.featured ? '#DAA52022' : '#ffffff00';

					row.main.onPointerEnterObservable.add((e) => {
						row.main.background = server.featured ? '#DAA52067' : '#ffffff67';
					});

					row.main.onPointerOutObservable.add((e) => {
						row.main.background = server.featured ? '#DAA52022' : '#ffffff00';
					});

					let click = 0;

					row.main.onPointerClickObservable.add((e) => {
						input.text = server.compabilityLayer == '0.30c' ? 'c0.30|' + (server.useProxy ? '*' : '') + server.ip : server.ip;
						click = click + 1;
						if (click > 1) button.onPointerClickObservable.notifyObservers(new GUI.Vector2WithInfo(new Vector2(0, 0), 0));

						setTimeout(() => {
							click = 0;
						}, 1000);
					});

					serverList.addControl(row.main);
				});
			});
	}

	const reloadButton = new GUI.Rectangle();
	reloadButton.height = `${17 * scale}px`;
	reloadButton.width = `${17 * scale}px`;
	reloadButton.top = `${-5 * scale}px`;
	reloadButton.left = `${-5 * scale}px`;
	reloadButton.verticalAlignment = 1;
	reloadButton.horizontalAlignment = 1;
	reloadButton.thickness = 0;
	reloadButton.background = '#4d4d4daa';
	reloadButton.color = '#666666';

	reloadButton.onPointerClickObservable.add(() => {
		updateList();
	});

	const reloadButtonText = new FormTextBlock();
	reloadButtonText.text = [{ text: '↻', color: 'white', font: 'Lato' }];
	reloadButtonText.textHorizontalAlignment = 2;
	reloadButtonText.fontSize = 11 * scale;
	reloadButton.onPointerEnterObservable.add((e) => {
		reloadButton.background = '#5d5d5daa';
	});

	reloadButton.onPointerOutObservable.add((e) => {
		reloadButton.background = '#4d4d4daa';
	});

	reloadButton.addControl(reloadButtonText);

	serverListContainer.addControl(reloadButton);

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Go back to menu', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		menu.dispose();
		openMenu('main');
	});
	menu.addControl(back.item);

	updateList();

	const rescale = (x) => {
		if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
		else menu.height = `100%`;
		menu.width = `${310 * scale}px`;

		name.fontSize = 13 * scale;

		input.height = `${17 * scale}px`;
		input.width = `${266 * scale}px`;
		input.top = `${18 * scale}px`;
		input.left = `${5 * scale}px`;
		input.fontSize = 6 * scale;

		button.height = `${17 * scale}px`;
		button.width = `${34 * scale}px`;
		button.top = `${18 * scale}px`;
		button.left = `${-5 * scale}px`;
		buttontext.fontSize = 6 * scale;

		serverListContainer.width = `${290 * scale}px`;
		serverListContainer.top = `${40 * scale}px`;
		serverListScroll.top = `${16 * scale}px`;
		serverListHeader.main.fontSize = 7 * scale;
		serverList.fontSize = 6 * scale;
		serverListScroll.height = `${150 * scale}px`;

		reloadButtonText.fontSize = 11 * scale;

		back.item.width = `${100 * scale}px`;
		back.item.height = `${18 * scale}px`;
		back.text.fontSize = 10 * scale;
	};

	event.on('scale-change', rescale);

	menu.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return menu;
}

function createRow() {
	const main = new GUI.Rectangle();
	main.height = `${16 * scale}px`;
	main.thickness = 0;

	const icon = new GUI.Image();
	icon.width = `${16 * scale}px`;
	icon.horizontalAlignment = 0;
	main.addControl(icon);

	const name = new GUI.Rectangle();
	name.width = '18%';
	name.left = '5%';
	name.horizontalAlignment = 0;
	name.thickness = 0;
	main.addControl(name);

	const motd = new GUI.Rectangle();
	motd.width = '47%';
	motd.horizontalAlignment = 0;
	motd.left = '23%';
	motd.thickness = 0;
	main.addControl(motd);

	const players = new GUI.Rectangle();
	players.width = '10%';
	players.horizontalAlignment = 0;
	players.left = '70%';
	players.thickness = 0;
	main.addControl(players);

	const software = new GUI.Rectangle();
	software.width = '20%';
	software.horizontalAlignment = 0;
	software.left = '80%';
	software.thickness = 0;
	main.addControl(software);

	const rescale = () => {
		main.height = `${16 * scale}px`;
		icon.width = `${16 * scale}px`;
	};

	event.on('scale-change', rescale);

	main.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return { main, icon, name, motd, players, software };
}

function sortServerList(a: IServerInfo, b: IServerInfo) {
	if (a.featured == b.featured) {
		if (a.type == b.type) return a.players.online < b.players.online ? 1 : a.players.online == b.players.online ? 0 : -1;
		else return a.type == 0 ? -1 : 1;
	} else return a.featured == false ? 1 : -1;
}
