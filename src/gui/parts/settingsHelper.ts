import { scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { createItem, createInput, createSlider } from './menu';
import { FormTextBlock, IFormatedText } from './formtextblock';
import { defaultValues } from '../../values';
import vkey from 'vkey';

export class SettingsGUI {
	main: GUI.Rectangle;
	panel: GUI.StackPanel;
	scroll: GUI.ScrollViewer;
	settings: object = {};
	lock: boolean = false;
	entries: { [i: string]: { gui: any; type: string; updateName: () => void } } = {};

	constructor(id: string, nameText: IFormatedText[], backHander: BackHandler) {
		this.main = new GUI.Rectangle();
		this.main.thickness = 0;
		this.main.horizontalAlignment = 2;
		this.main.zIndex = 10;
		if (window.innerHeight > 230 * scale) this.main.height = `${230 * scale}px`;
		else this.main.height = `100%`;
		this.main.width = `${220 * scale}px`;
		this.main.background = defaultValues.menuColor;

		const name = new FormTextBlock();
		name.fontFamily = 'Lato';
		name.fontSize = 14 * scale;
		name.textVerticalAlignment = 0;
		name.color = 'white';
		name.text = nameText;
		name.top = scale;

		this.main.addControl(name);

		const scroll = new GUI.ScrollViewer();
		scroll.verticalAlignment = 0;
		scroll.top = `${18 * scale}px`;
		scroll.width = `${210 * scale}px`;
		scroll.height = `80%`;
		scroll.thickness = 0;
		scroll.barColor = '#ffffff44';
		scroll.barBackground = '#00000000';
		this.scroll = scroll;

		this.main.addControl(scroll);

		const settings = new GUI.StackPanel();
		scroll.addControl(settings);

		this.panel = settings;

		const back = createItem();
		back.item.verticalAlignment = 1;
		back.text.text = [{ text: 'Back', color: 'white', font: 'Lato' }];

		back.item.onPointerClickObservable.add(() => {
			if (!this.lock) {
				backHander(id, this.settings);
				this.main.dispose();
			}
		});

		this.main.addControl(back.item);

		const rescale = (x) => {
			if (window.innerHeight > 230 * scale) this.main.height = `${230 * scale}px`;
			else this.main.height = `100%`;

			this.main.width = `${220 * scale}px`;

			name.fontSize = 14 * scale;

			scroll.top = `${18 * scale}px`;
			scroll.width = `${210 * scale}px`;

			back.item.width = `${100 * scale}px`;
			back.item.height = `${18 * scale}px`;
			back.text.fontSize = 10 * scale;
		};

		event.on('scale-change', rescale);

		this.main.onDisposeObservable.add(() => {
			event.off('scale-change', rescale);
		});
	}

	createSlider(id: string, nameUpdater: NameUpdater, value: number, min: number, max: number, step: number) {
		const slider = createSlider();
		slider.name.text = nameUpdater(value);
		slider.slider.value = value;
		slider.slider.minimum = min;
		slider.slider.maximum = max;
		slider.slider.step = step;
		this.settings[id] = value;
		slider.slider.onValueChangedObservable.add((x) => {
			slider.name.text = nameUpdater(x);
			this.settings[id] = x;
		});
		this.panel.addControl(slider.main);

		this.entries[id] = {
			gui: slider,
			type: 'slider',
			updateName: () => {
				slider.name.text = nameUpdater(this.settings[id]);
			},
		};

		return slider;
	}

	createInput(id: string, name: string, value: string, placeholder: string, mobileText: string) {
		const input = createInput();
		input.name.text = name;
		input.input.placeholderText = placeholder;
		input.input.text = value;
		input.input.promptMessage = mobileText;

		this.settings[id] = value;

		input.input.onTextChangedObservable.add((x) => {
			this.settings[id] = x.text;
		});

		this.panel.addControl(input.main);

		this.entries[id] = { gui: input, type: 'input', updateName: () => {} };

		return input;
	}

	createSelectable(id: string, nameUpdater: NameUpdater, value: number, possibleValues: any[]) {
		let selected = value;
		this.settings[id] = selected;

		const item = createItem(200);

		item.text.text = [{ text: nameUpdater(selected), color: 'white', font: 'Lato' }];
		item.item.onPointerClickObservable.add(() => {
			console.log(selected, possibleValues.length);
			selected = selected + 1;

			if (selected >= possibleValues.length) {
				selected = 0;
			}

			this.settings[id] = selected;

			item.text.text[0].text = nameUpdater(selected);
			item.text._markAsDirty();
		});

		this.panel.addControl(item.item);

		this.entries[id] = {
			gui: item,
			type: 'selectable',
			updateName: () => {
				item.text.text[0].text = nameUpdater(selected);
				item.text._markAsDirty();
			},
		};

		return item;
	}

	createLabel(id: string, name: string) {
		const item = new GUI.Rectangle();
		item.width = `${200 * scale}px`;
		item.height = `${18 * scale}px`;
		item.isPointerBlocker = true;
		item.horizontalAlignment = 2;
		item.thickness = 0;
		item.paddingBottom = '10px';
		item.zIndex = 10;

		const text = new GUI.TextBlock();
		text.fontFamily = 'lato';
		text.fontSize = `${12 * scale}px`;
		text.text = name;
		text.color = 'white';
		//text.underline = true;

		item.addControl(text);

		const scaleUpdate = () => {
			text.fontSize = `${12 * scale}px`;
			item.width = `${200 * scale}px`;
			item.height = `${20 * scale}px`;
		};

		event.on('scale', scaleUpdate);

		item.onDisposeObservable.add(() => {
			event.off('scale', scaleUpdate);
		});

		this.panel.addControl(item);

		this.entries[id] = { gui: item, type: 'label', updateName: () => {} };

		return item;
	}

	createKeybind(id: string, nameUpdater: NameUpdater, value: string) {
		const item = createItem(200);

		item.text.text = [{ text: nameUpdater(value), color: 'white', font: 'Lato' }];
		item.item.onPointerClickObservable.add(() => {
			if (this.lock) return;

			this.lock = true;
			const update = (key: string) => {
				document.removeEventListener('keydown', keyboard);
				document.removeEventListener('mousedown', mouse);

				if (key != undefined) {
					this.settings[id] = key;
				}
				item.text.text[0].text = nameUpdater(this.settings[id]);
				item.text._markAsDirty();
				setTimeout(() => (this.lock = false), 100);
			};

			const keyboard = (ev: KeyboardEvent) => {
				ev.preventDefault();
				ev.stopPropagation();
				ev.stopImmediatePropagation();
				update(vkey[ev.keyCode]);
			};

			const mouse = (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				ev.stopImmediatePropagation();
				const keycode = -1 - ev.button;
				update('<mouse ' + (ev.button + 1) + '>');
			};

			document.addEventListener('keydown', keyboard);
			document.addEventListener('mousedown', mouse);

			item.text.text[0].text = nameUpdater(null);
			item.text._markAsDirty();
		});

		this.panel.addControl(item.item);

		this.entries[id] = {
			gui: item,
			type: 'keybind',
			updateName: () => {
				item.text.text[0].text = nameUpdater(this.settings[id]);
				item.text._markAsDirty();
			},
		};

		return item;
	}

	createItem(id: string, name: string) {
		const item = createItem(200, 11);
		item.text.text = [{ text: name, color: 'white', font: 'Lato' }];
		this.panel.addControl(item.item);

		this.entries[id] = { gui: item, type: 'item', updateName: () => {} };

		return item;
	}

	setValue(id: string, value: any) {
		if (this.entries[id] != undefined) {
			this.settings[id] = value;
			this.entries[id].updateName();
		}
	}
}

export type BackHandler = (id: string, settings: { [index: string]: any }) => void;

export type NameUpdater = (value: any) => string;
