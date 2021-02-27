import { scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { createItem, createButton } from '../parts/menu';

import { defaultValues, IWorldSettings, singleplayerServerInfo } from '../../values';
import { getWorldList, IWorld } from '../../lib/helpers/storage';
import { createSingleplayerServer } from '../../lib/singleplayer/setup';
import { setupConnection } from '../../lib/gameplay/connect';
import { Engine } from 'noa-engine';
import { buildWorldCreationGui } from './spWorldCreation';
import { buildWorldEditorGui } from './spWorldEditor';

import { exportWorldAsZip, importWorldFromZip } from '../../lib/singleplayer/spHelpers';
import { PopupGUI } from '../parts/miniPopupHelper';
import { downloadBlob } from '../../lib/helpers/general';
import { addToast, toastColors } from '../parts/toastMessage';

export default function buildSingleplayer(noa: Engine, openMenu, holder) {
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
	name.text = 'Singleplayer';
	name.top = scale;

	menu.addControl(name);

	let selected: IWorld;
	let takenNames = [];
	let lock = false;

	const create = createButton(56);
	create.button.top = `${18 * scale}px`;
	create.button.left = `${5 * scale}px`;
	create.buttonText.text = [{ text: 'Create World', color: 'white', font: 'Lato' }];

	create.button.onPointerClickObservable.add(() => {
		buildWorldCreationGui(noa, takenNames, openMenu, holder);
		menu.dispose();
	});
	menu.addControl(create.button);

	const play = createButton(56);
	play.button.top = `${18 * scale}px`;
	play.button.left = `${66 * scale}px`;
	play.buttonText.text = [{ text: 'Select', color: 'white', font: 'Lato' }];

	play.button.onPointerClickObservable.add(() => {
		if (selected != undefined && !lock) {
			lock = true;
			setupConnection(noa, createSingleplayerServer(selected.name, selected.settings), {
				...singleplayerServerInfo,
				motd: selected.settings.displayName || selected.name,
			});
			selected = undefined;
		}
	});
	menu.addControl(play.button);

	const edit = createButton(56);
	edit.button.top = `${18 * scale}px`;
	edit.button.left = `${127 * scale}px`;
	edit.buttonText.text = [{ text: 'Edit world', color: 'white', font: 'Lato' }];

	edit.button.onPointerClickObservable.add(async () => {
		if (selected != undefined && !lock) {
			lock = true;
			menu.dispose();

			buildWorldEditorGui(noa, selected, openMenu, holder);
		}
	});
	menu.addControl(edit.button);

	const exportButton = createButton(56);
	exportButton.button.top = `${18 * scale}px`;
	exportButton.button.left = `${188 * scale}px`;
	exportButton.buttonText.text = [{ text: 'Export', color: 'white', font: 'Lato' }];

	exportButton.button.onPointerClickObservable.add(async () => {
		if (selected != undefined && !lock) {
			lock = true;
			menu.isVisible = false;
			const exportScreen = new PopupGUI([{ text: 'Exporting world...' }]);
			exportScreen.setSubtitle([{ text: selected.settings.displayName || selected.name }]);
			exportScreen.setCenterText([{ text: 'Starting...' }]);
			holder.addControl(exportScreen.main);
			const blob = await exportWorldAsZip(selected.name, (text) => {
				exportScreen.setCenterText([{ text: text }]);
			});
			downloadBlob(blob, selected.name + '.zip');

			exportScreen.dispose();
			selected = undefined;
			updateWorldList();
			menu.isVisible = true;
			lock = false;
		}
	});

	menu.addControl(exportButton.button);

	const importButton = createButton(56);
	importButton.button.top = `${18 * scale}px`;
	importButton.button.left = `${249 * scale}px`;
	importButton.buttonText.text = [{ text: 'Import', color: 'white', font: 'Lato' }];

	importButton.button.onPointerClickObservable.add(async () => {
		if (!lock) {
			lock = true;
			selected = undefined;
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'application/zip';
			input.click();
			const event = async () => {
				document.body.removeEventListener('focusin', event);
				if (input.files.length != 0) {
					menu.isVisible = false;
					const importScreen = new PopupGUI([{ text: 'Exporting world...' }]);
					importScreen.setCenterText([{ text: 'Starting...' }]);
					holder.addControl(importScreen.main);
					try {
						await importWorldFromZip(input.files[0], (text, displayName: string = null) => {
							importScreen.setCenterText([{ text: text }]);
							if (displayName != null) {
								importScreen.setSubtitle([{ text: displayName }]);
							}
						});
					} catch (e) {
						console.error(e)
						addToast([{ text: 'Invalid world!' }], [{ text: 'You tried to import invalid world file!' }], toastColors.error, 5);
					}
					importScreen.dispose();
					menu.isVisible = true;
				}
				updateWorldList();
				lock = false;
			};

			document.body.addEventListener('focusin', event);
		}
	});

	menu.addControl(importButton.button);

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
		worldList.children.forEach((x) => x.dispose());
		worldList.clearControls();
		takenNames = [];

		getWorldList().then((data) => {
			data.forEach((world) => {
				const row = createRow();

				row.icon.source = './servericons/' + world.settings.icon + '.png';

				const sname = new GUI.TextBlock();
				sname.text = world.settings.displayName || world.name;
				sname.color = '#222222';
				row.name.addControl(sname);

				const sdate = new GUI.TextBlock();
				sdate.text = new Date(world.lastplay).toLocaleString();
				sdate.color = '#222222';
				row.date.addControl(sdate);

				const stype = new GUI.TextBlock();
				stype.text = world.settings.gamemode.charAt(0).toUpperCase() + world.settings.gamemode.slice(1);
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

		name.fontSize = 13 * scale;

		worldListContainer.width = `${290 * scale}px`;
		worldListContainer.top = `${40 * scale}px`;
		worldListScroll.top = `${16 * scale}px`;
		worldListHeader.main.fontSize = 7 * scale;
		worldList.fontSize = 6 * scale;
		worldListScroll.height = `${150 * scale}px`;

		create.button.top = `${18 * scale}px`;
		create.button.left = `${5 * scale}px`;

		play.button.top = `${18 * scale}px`;
		play.button.left = `${66 * scale}px`;

		edit.button.top = `${18 * scale}px`;
		edit.button.left = `${127 * scale}px`;

		exportButton.button.top = `${18 * scale}px`;
		exportButton.button.left = `${188 * scale}px`;

		importButton.button.top = `${18 * scale}px`;
		importButton.button.left = `${249 * scale}px`;

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
	name.width = '45%';
	name.left = '5%';
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

	const rescale = () => {
		main.height = `${16 * scale}px`;
		icon.width = `${16 * scale}px`;
	};

	event.on('scale-change', rescale);

	main.onDisposeObservable.add(() => {
		event.off('scale-change', rescale);
	});

	return { icon, main, name, date, type };
}
