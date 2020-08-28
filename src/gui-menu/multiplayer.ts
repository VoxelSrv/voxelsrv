import { scale, event } from '../gui/main';
import * as GUI from '@babylonjs/gui/';
import { FormTextBlock } from '../gui-uni/formtextblock';
import { Socket } from '../socket';
import { connect } from '../lib/connect'
import { Vector2 } from '@babylonjs/core';
import { createItem } from '../gui-uni/menu';


export default function buildMultiplayer(noa, openMenu) {
	const menu = new GUI.Rectangle();
	menu.thickness = 0;
	menu.horizontalAlignment = 2;
	menu.zIndex = 10;
	menu.height = `${230 * scale}px`;
	menu.width = `${280 * scale}px`;
	menu.background = '#11111166';

	const name = new GUI.TextBlock();
	name.fontFamily = 'Lato';
	name.fontSize = 11 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Multiplayer';
	name.top = scale;

	menu.addControl(name);

	const input = new GUI.InputText();

	input.height = `${17 * scale}px`;
	input.width = `${236 * scale}px`;
	input.top = `${18 * scale}px`;
	input.left = `${5 * scale}px`;
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
		let address = input.text;
		if (!(address.startsWith('wss://') || address.startsWith('ws://'))) address = 'ws://' + address;
		const socket = new Socket(address);
		connect(noa, socket);
	});

	const buttontext = new FormTextBlock();
	buttontext.text = [{ text: 'Connect', color: 'white', font: 'Lato' }];
	buttontext.textHorizontalAlignment = 2;
	buttontext.onPointerEnterObservable.add((e) => {
		buttontext.text.forEach((x) => (x.underline = true));
		buttontext._markAsDirty();
	});

	buttontext.onPointerOutObservable.add((e) => {
		buttontext.text.forEach((x) => (x.underline = false));
		buttontext._markAsDirty();
	});
	button.addControl(buttontext);

	menu.addControl(button);

	const serverListContainer = new GUI.Rectangle();
	serverListContainer.width = `${260 * scale}px`;
	serverListContainer.height = `${160 * scale}px`;
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
	serverListScroll.top = '40px';
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

	fetch('http://pb4.eu:9001')
		.then((response) => response.json())
		.then((data: any) => {
			Object.values(data).forEach((server: any) => {
				const row = createRow();

				const sname = new GUI.TextBlock();
				sname.text = server.name;
				sname.color = '#222222';
				row.name.addControl(sname);

				const smotd = new GUI.TextBlock();
				smotd.text = server.motd;
				smotd.color = '#222222';
				row.motd.addControl(smotd);

				const splayer = new GUI.TextBlock();
				splayer.text = `${server.numberplayers}/${server.maxplayers}`;
				splayer.color = '#222222';
				row.players.addControl(splayer);

				const ssoftware = new GUI.TextBlock();
				ssoftware.text = server.software;
				ssoftware.color = '#222222';
				row.software.addControl(ssoftware);

				row.main.onPointerEnterObservable.add((e) => {
					row.main.background = '#ffffff67';
				});

				row.main.onPointerOutObservable.add((e) => {
					row.main.background = '#ffffff00';
				});

				let click = 0;

				row.main.onPointerClickObservable.add((e) => {
					input.text = server.ip;
					click = click + 1;
					if (click > 1) button.onPointerClickObservable.notifyObservers(new GUI.Vector2WithInfo(new Vector2(0, 0), 0));

					setTimeout(() => {
						click = 0;
					}, 1000);
				});

				serverList.addControl(row.main);
			});
		});

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Go back to menu', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		menu.dispose();
		openMenu('main');
	});
	menu.addControl(back.item);

	const rescale = (x) => {
		menu.height = `${230 * scale}px`;
		menu.width = `${280 * scale}px`;

		name.fontSize = 11 * scale;

		input.height = `${17 * scale}px`;
		input.width = `${236 * scale}px`;
		input.top = `${18 * scale}px`;
		input.left = `${5 * scale}px`;

		button.height = `${17 * scale}px`;
		button.width = `${34 * scale}px`;
		button.top = `${18 * scale}px`;
		button.left = `${-5 * scale}px`;

		serverListContainer.width = `${260 * scale}px`;
		serverListContainer.height = `${160 * scale}px`;
		serverListContainer.top = `${40 * scale}px`;
		serverListHeader.main.fontSize = 7 * scale;
		serverList.fontSize = 6 * scale;
		serverListScroll.height = `${150 * scale}px`;

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
	main.height = '40px';
	main.thickness = 0;

	const name = new GUI.Rectangle();
	name.width = '20%';
	name.horizontalAlignment = 0;
	name.thickness = 0;
	main.addControl(name);

	const motd = new GUI.Rectangle();
	motd.width = '50%';
	motd.horizontalAlignment = 0;
	motd.left = '20%';
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

	return { main, name, motd, players, software };
}
