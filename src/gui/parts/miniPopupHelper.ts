import { scale, event } from '../main';
import * as GUI from '@babylonjs/gui/';
import { createItem } from './menu';
import { FormTextBlock, IFormatedText } from './formtextblock';
import { defaultValues } from '../../values';

export class PopupGUI {
	main: GUI.Rectangle;
	title: FormTextBlock;
	subtitle: FormTextBlock;
	panel: GUI.StackPanel;
	center: GUI.Rectangle;
	centerText: FormTextBlock;
	settings: object = {};
	lock: boolean = false;

	constructor(nameText: IFormatedText[]) {
		const menu = new GUI.Rectangle();
		menu.thickness = 0;
		menu.horizontalAlignment = 2;
		menu.zIndex = 20;
		menu.height = `${120 * scale}px`;
		menu.width = `${180 * scale}px`;
		menu.background = defaultValues.menuColor;

		this.main = menu;

		const title = new FormTextBlock();
		title.fontFamily = 'Lato';
		title.fontSize = 12 * scale;
		title.textVerticalAlignment = 0;
		title.color = 'white';
		title.text = nameText;
		title.top = scale;

		menu.addControl(title);

		const subtitle = new FormTextBlock();
		subtitle.fontFamily = 'Lato';
		subtitle.fontSize = 10 * scale;
		subtitle.textVerticalAlignment = 0;
		subtitle.color = 'white';
		subtitle.text = [{text:''}];
		subtitle.top = 14 * scale;

		menu.addControl(subtitle);

		this.title = title;
		this.subtitle = subtitle;

		const center = new GUI.Rectangle();
		center.thickness = 0;
		this.center = center;
		menu.addControl(center);

		const panel = new GUI.StackPanel()
		panel.verticalAlignment = 1;

		menu.addControl(panel)
		this.panel = panel;


		const rescale = (x) => {
			menu.height = `${120 * scale}px`;
			menu.width = `${180 * scale}px`;
			title.fontSize = 12 * scale;
			title.top = scale;

			panel.width = `${180 * scale}px`

			subtitle.fontSize = 10 * scale;
			subtitle.top = 14 * scale;
		};

		event.on('scale-change', rescale);

		menu.onDisposeObservable.add(() => {
			event.off('scale-change', rescale);
		});
	}

	setCenterText(text: IFormatedText[]) {
		if (this.centerText == undefined) {
			this.centerText = new FormTextBlock();
			this.centerText.fontFamily = 'Lato';
			this.centerText.fontSize = 10 * scale;
			this.centerText.color = 'white';
			this.centerText.text = [];

			this.center.addControl(this.centerText);

			const rescale = (x) => {
				this.centerText.fontSize = 10 * scale;
			};

			event.on('scale-change', rescale);

			this.main.onDisposeObservable.add(() => {
				event.off('scale-change', rescale);
			});
		}

		this.centerText.text = text;
	}

	setTitle(text: IFormatedText[]) {
		this.title.text = text;
	}

	setSubtitle(text: IFormatedText[]) {
		this.subtitle.text = text;
	}

	createItem(name: string, callback: () => any) {
		const item = createItem();
		item.text.text = [{ text: name, color: 'white', font: 'Lato' }];
		this.panel.addControl(item.item);

		item.item.onPointerClickObservable.add(callback)		

		return item;
	}

	dispose() {
		this.main.dispose();
	}
}

