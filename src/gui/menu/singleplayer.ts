import { getScreen, scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { FormTextBlock } from '../parts/formtextblock';
import { createItem, createButton, createInput } from '../parts/menu';

import { defaultValues, gameVersion } from '../../values';
import { getWorldList } from '../../lib/helpers/storage';

export default function buildSingleplayer(noa, openMenu) {
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

	let selected = null;

	const create = createButton();
	create.button.top = `${18 * scale}px`;
	create.button.left = `${5 * scale}px`;
	create.buttonText.text = [{ text: 'Create World', color: 'white', font: 'Lato' }];

	create.button.onPointerClickObservable.add(() => {
		openWorldCreation();
	});
	menu.addControl(create.button);

	const remove = createButton();
	remove.button.top = `${18 * scale}px`;
	remove.button.left = `${74 * scale}px`;
	remove.buttonText.text = [{ text: 'Remove', color: 'white', font: 'Lato' }];

	remove.button.onPointerClickObservable.add(() => {});
	//menu.addControl(remove.button)

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
	worldListScroll.top = `${13 * scale}px`;
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

	getWorldList().then((data) => {
		data.forEach((world: any) => {
			const row = createRow();

			const sname = new GUI.TextBlock();
			sname.text = world.name;
			sname.color = '#222222';
			row.name.addControl(sname);

			const sdate = new GUI.TextBlock();
			sdate.text = world.date.toString();
			sdate.color = '#222222';
			row.date.addControl(sdate);

			const stype = new GUI.TextBlock();
			stype.text = world.type;
			stype.color = '#222222';
			row.type.addControl(stype);

			let click = 0;

			row.main.onPointerClickObservable.add((e) => {
				worldArray.forEach((x) => {
					x.row.main.background = '#ffffff00';
				});
				row.main.background = '#ffffffaa';

				click = click + 1;
				if (click > 1) 
				setTimeout(() => {
					click = 0;
				}, 500);
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
		remove.button.top = `${18 * scale}px`;
		remove.button.left = `${74 * scale}px`;

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
	main.height = `${13 * scale}px`;
	main.thickness = 0;

	const rescale = () => {
		main.height = `${13 * scale}px`;
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

function openWorldCreation() {
	const ui = getScreen(2);
	const menu = new GUI.Rectangle();
	menu.background = '#11111188';
	if (window.innerHeight > 230 * scale) menu.height = `${230 * scale}px`;
	else menu.height = `100%`;
	menu.width = `${220 * scale}px`;
	menu.thickness = 0;
	menu.zIndex = 200;

	const settings = new GUI.StackPanel();
	settings.verticalAlignment = 0;
	settings.top = `${18 * scale}px`;
	settings.width = `${210 * scale}px`;
	settings.height = `80%`;
	settings.verticalAlignment = 0;
	settings.top = `${18 * scale}px`;
	settings.width = `${210 * scale}px`;
	settings.height = `80%`;

	const nickname = createInput();
	nickname.name.text = 'Worldname';
	nickname.input.placeholderText = `World`;
	nickname.input.text = 'World';

	settings.addControl(nickname.main);

	const create = createItem();
	create.item.verticalAlignment = 1;
	create.text.text = [{ text: 'Create', color: 'white', font: 'Lato' }];
	create.item.top = `-${16 * scale}px`;
	create.item.onPointerClickObservable.add(() => {
		menu.dispose();
		

		/*window.electron.send('world-create', {
			data: {
				name: nickname.input.text,
				date: Date.now(),
				type: 'Infinite',
				voxelsrv: gameVersion,
			},
			config: {},
			world: nickname.input.text,
		});*/
	});

	menu.addControl(create.item);

	const back = createItem();
	back.item.verticalAlignment = 1;
	back.text.text = [{ text: 'Back', color: 'white', font: 'Lato' }];

	back.item.onPointerClickObservable.add(() => {
		menu.dispose();
	});
	menu.addControl(back.item);

	menu.addControl(settings);
	ui.addControl(menu);
}
