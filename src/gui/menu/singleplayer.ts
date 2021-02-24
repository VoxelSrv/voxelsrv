import { getScreen, scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { FormTextBlock } from '../parts/formtextblock';
import { createItem, createButton, createInput } from '../parts/menu';

import { defaultValues, gameProtocol, gameVersion, IWorldSettings, singleplayerServerInfo } from '../../values';
import { deleteWorld, getWorldList } from '../../lib/helpers/storage';
import { createSingleplayerServer } from '../../lib/singleplayer/setup';
import { setupConnection } from '../../lib/gameplay/connect';
import { Engine } from 'noa-engine';
import { buildWorldCreationGui } from './spWorldCreation';

export default function buildSingleplayer(noa: Engine, openMenu) {
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
	name.fontSize = 11 * scale;
	name.textVerticalAlignment = 0;
	name.color = 'white';
	name.text = 'Singleplayer';
	name.top = scale;

	menu.addControl(name);

	let selected: { name: string; settings: IWorldSettings };
	let takenNames = [];
	let lock = false;

	const create = createButton();
	create.button.top = `${18 * scale}px`;
	create.button.left = `${5 * scale}px`;
	create.buttonText.text = [{ text: 'Create World', color: 'white', font: 'Lato' }];

	create.button.onPointerClickObservable.add(() => {
		buildWorldCreationGui(noa, takenNames, openMenu);
		menu.dispose();
	});
	menu.addControl(create.button);

	const play = createButton();
	play.button.top = `${18 * scale}px`;
	play.button.left = `${74 * scale}px`;
	play.buttonText.text = [{ text: 'Select', color: 'white', font: 'Lato' }];

	play.button.onPointerClickObservable.add(() => {
		if (selected != undefined) {
			lock = true;
			setupConnection(noa, createSingleplayerServer(selected.name, selected.settings), singleplayerServerInfo);
			selected = undefined;
		}
	});
	menu.addControl(play.button);

	const remove = createButton();
	remove.button.top = `${18 * scale}px`;
	remove.button.left = `${143 * scale}px`;
	remove.buttonText.text = [{ text: 'Remove', color: 'white', font: 'Lato' }];

	remove.button.onPointerClickObservable.add(async () => {
		if (selected != undefined) {
			lock = true;
			await deleteWorld(selected.name);
			selected = undefined;
			updateWorldList();
			lock = false;
		}
	});
	menu.addControl(remove.button);

	const worldListContainer = new GUI.Rectangle();
	worldListContainer.width = `${290 * scale}px`;
	worldListContainer.height = '70%';
	worldListContainer.verticalAlignment = 0;
	worldListContainer.top = `${40 * scale}px`;
	worldListContainer.background = '#ffffffbb';
	worldListContainer.thickness = 0;

	const worldListHeader = createRow();
	worldListHeader.main.verticalAlignment = 0;
	worldListHeader.main.fontFamily = 'Lato';
	worldListHeader.main.background = '#88888855';
	worldListHeader.main.fontSize = 7 * scale;

	const hname = new GUI.TextBlock();
	hname.text = 'Name';
	hname.color = '#222222';
	worldListHeader.name.addControl(hname);

	const hdate = new GUI.TextBlock();
	hdate.text = 'Last played';
	hdate.color = '#222222';
	worldListHeader.date.addControl(hdate);

	const htype = new GUI.TextBlock();
	htype.text = 'Type';
	htype.color = '#222222';
	worldListHeader.type.addControl(htype);

	worldListContainer.addControl(worldListHeader.main);

	menu.addControl(worldListContainer);

	const worldListScroll = new GUI.ScrollViewer();
	worldListScroll.height = `${150 * scale}px`;
	worldListScroll.top = `${16 * scale}px`;
	worldListScroll.thickness = 0;
	worldListScroll.verticalAlignment = 0;
	worldListScroll.barSize = 0;
	worldListContainer.addControl(worldListScroll);

	const worldList = new GUI.StackPanel();
	worldList.fontFamily = 'Lato';
	worldList.width = '100%';
	worldList.fontSize = 6 * scale;
	worldList.verticalAlignment = 0;

	worldListScroll.addControl(worldList);

	let worldArray = [];

	function updateWorldList() {
		worldList.children.forEach( x => x.dispose())
		worldList.clearControls();
		takenNames = [];

		getWorldList().then((data) => {
			data.forEach((world) => {
				const row = createRow();

				const sname = new GUI.TextBlock();
				sname.text = world.name;
				sname.color = '#222222';
				row.name.addControl(sname);

				const sdate = new GUI.TextBlock();
				sdate.text = new Date(world.lastplay).toLocaleString();
				sdate.color = '#222222';
				row.date.addControl(sdate);

				const stype = new GUI.TextBlock();
				stype.text = world.settings.gamemode.charAt(0).toUpperCase() + world.settings.gamemode.slice(1) ;
				stype.color = '#222222';
				row.type.addControl(stype);

				let click = 0;

				row.main.onPointerClickObservable.add((e) => {
					worldArray.forEach((x) => {
						x.row.main.background = '#ffffff00';
					});
					row.main.background = '#ffffffaa';

					selected = world;

					click = click + 1;
					if (click > 1 && !lock) {
						setupConnection(noa, createSingleplayerServer(world.name, world.settings), singleplayerServerInfo);
					}

					setTimeout(() => {
						click = click - 1;
					}, 500)
				});

				row.main.onPointerEnterObservable.add((e) => {
					if (row.main.background == '#ffffffaa') return;
					row.main.background = '#ffffff67';
				});

				row.main.onPointerOutObservable.add((e) => {
					if (row.main.background == '#ffffffaa') return;
					row.main.background = '#ffffff00';
				});

				worldList.addControl(row.main);

				worldArray.push({ data: world, row: row });
				takenNames.push(world.name);
			});
		});
	}
	updateWorldList();

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Go back to menu', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		menu.dispose();
		openMenu('main');
	});
	menu.addControl(back.item);

	const rescale = (x) => {
		if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
		else menu.height = `100%`;
		menu.width = `${310 * scale}px`;

		name.fontSize = 11 * scale;

		worldListContainer.width = `${290 * scale}px`;
		worldListContainer.top = `${40 * scale}px`;
		worldListScroll.top = `${13 * scale}px`;
		worldListHeader.main.fontSize = 7 * scale;
		worldList.fontSize = 6 * scale;
		worldListScroll.height = `${150 * scale}px`;

		create.button.top = `${18 * scale}px`;
		create.button.left = `${5 * scale}px`;

		play.button.top = `${18 * scale}px`;
		play.button.left = `${74 * scale}px`;

		remove.button.top = `${18 * scale}px`;
		remove.button.left = `${143 * scale}px`;

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

	const rescale = () => {
		main.height = `${16 * scale}px`;
	};

	event.on('scale-change', rescale);

	main.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	const name = new GUI.Rectangle();
	name.width = '50%';
	name.horizontalAlignment = 0;
	name.thickness = 0;
	main.addControl(name);

	const date = new GUI.Rectangle();
	date.width = '20%';
	date.horizontalAlignment = 0;
	date.left = '50%';
	date.thickness = 0;
	main.addControl(date);

	const type = new GUI.Rectangle();
	type.width = '20%';
	type.horizontalAlignment = 0;
	type.left = '80%';
	type.thickness = 0;
	main.addControl(type);

	return { main, name, date, type };
}
