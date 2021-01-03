/*
 * Modified copy of class TextBlock from BABYLON.JS
 * https://github.com/BabylonJS/Babylon.js/blob/master/gui/src/2D/controls/textBlock.ts
 */

import { Observable } from '@babylonjs/core/Misc/observable';
import { Measure } from '@babylonjs/gui/2D/measure';
import { ValueAndUnit } from '@babylonjs/gui/2D/valueAndUnit';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Nullable } from '@babylonjs/core/types';
import { Vector2 } from '@babylonjs/core/Maths';
import { PointerInfoBase } from '@babylonjs/core';

export interface IFormatedText {
	text: string;
	color?: string;
	font?: string;
	underline?: boolean;
	linethrough?: boolean;
	url?: string;
}

interface IRefText {
	text: string;
	ref: IFormatedText;
	width?: number;
}

export interface ITextArea {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
	ref: IFormatedText;
	text: string;
}

/**
 * Class used to create text block control
 */
export class FormTextBlock extends Control {
	private _text: Array<IFormatedText> = [];
	private _textPos: Array<ITextArea> = [];
	private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
	private _textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

	private _lines: any[];
	private _resizeToFit: boolean = false;
	private _lineSpacing: ValueAndUnit = new ValueAndUnit(0);

	public shouldhide: boolean = false;
	/**
	 * An event triggered after the text is changed
	 */
	public onTextChangedObservable = new Observable<FormTextBlock>();

	/**
	 * An event triggered after the text was broken up into lines
	 */
	public onLinesReadyObservable = new Observable<FormTextBlock>();

	/**
	 * Function used to split a string into words. By default, a string is split at each space character found
	 */
	public wordSplittingFunction: Nullable<(line: string) => string[]>;

	/**
	 * Returns text areas
	 */
	public get getTextAreas(): ITextArea[] {
		return this._textPos;
	}

	/**
	 * Return the line list (you may need to use the onLinesReadyObservable to make sure the list is ready)
	 */
	public get lines(): any[] {
		return this._lines;
	}

	/**
	 * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
	 */
	public get resizeToFit(): boolean {
		return this._resizeToFit;
	}

	/**
	 * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
	 */
	public set resizeToFit(value: boolean) {
		if (this._resizeToFit === value) {
			return;
		}
		this._resizeToFit = value;

		if (this._resizeToFit) {
			this._width.ignoreAdaptiveScaling = true;
			this._height.ignoreAdaptiveScaling = true;
		}

		this._markAsDirty();
	}

	/**
	 * Gets or sets text to display
	 */
	public get text(): Array<IFormatedText> {
		return this._text;
	}

	/**
	 * Gets or sets text to display
	 */
	public set text(value: Array<IFormatedText>) {
		if (this._text === value) {
			return;
		}
		this._text = value;
		this._markAsDirty();

		this.onTextChangedObservable.notifyObservers(this);
	}

	/**
	 * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
	 */
	public get textHorizontalAlignment(): number {
		return this._textHorizontalAlignment;
	}

	/**
	 * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
	 */
	public set textHorizontalAlignment(value: number) {
		if (this._textHorizontalAlignment === value) {
			return;
		}

		this._textHorizontalAlignment = value;
		this._markAsDirty();
	}

	/**
	 * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
	 */
	public get textVerticalAlignment(): number {
		return this._textVerticalAlignment;
	}

	/**
	 * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
	 */
	public set textVerticalAlignment(value: number) {
		if (this._textVerticalAlignment === value) {
			return;
		}

		this._textVerticalAlignment = value;
		this._markAsDirty();
	}

	/**
	 * Gets or sets line spacing value
	 */
	public set lineSpacing(value: string | number) {
		if (this._lineSpacing.fromString(value)) {
			this._markAsDirty();
		}
	}

	/**
	 * Gets or sets line spacing value
	 */
	public get lineSpacing(): string | number {
		return this._lineSpacing.toString(this._host);
	}

	/**
	 * Creates a new TextBlock object
	 * @param name defines the name of the control
	 * @param text defines the text to display (emptry string by default)
	 */
	constructor(
		/**
		 * Defines the name of the control
		 */
		public name?: string,
		text: Array<IFormatedText> = []
	) {
		super(name);

		this.text = text;
	}

	protected _getTypeName(): string {
		return 'FormTextBlock';
	}

	protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
		if (!this._fontOffset) {
			this._fontOffset = Control._GetFontOffset(context.font);
		}

		super._processMeasures(parentMeasure, context);

		// Prepare lines
		this._lines = this._breakLines(this._currentMeasure.width, context);
		this.onLinesReadyObservable.notifyObservers(this);

		let maxLineWidth: number = 0;

		for (let i = 0; i < this._lines.length; i++) {
			const line = this._lines[i];

			if (line.width > maxLineWidth) {
				maxLineWidth = line.width;
			}
		}

		if (this._resizeToFit) {
			let newHeight = (this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * this._lines.length) | 0;

			if (this._lines.length > 0 && this._lineSpacing.internalValue !== 0) {
				let lineSpacing = 0;
				if (this._lineSpacing.isPixel) {
					lineSpacing = this._lineSpacing.getValue(this._host);
				} else {
					lineSpacing = this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
				}

				newHeight += (this._lines.length - 1) * lineSpacing;
			}

			if (newHeight !== this._height.internalValue) {
				this._height.updateInPlace(newHeight, ValueAndUnit.UNITMODE_PIXEL);
				this._rebuildLayout = true;
			}
		}
	}

	private _drawText(text: Array<IRefText>, textWidth: number, y: number, context: CanvasRenderingContext2D, newTextAreas: ITextArea[]): void {
		var width = this._currentMeasure.width;
		var x = 0;
		switch (this._textHorizontalAlignment) {
			case Control.HORIZONTAL_ALIGNMENT_LEFT:
				x = 0;
				break;
			case Control.HORIZONTAL_ALIGNMENT_RIGHT:
				x = width - textWidth;
				break;
			case Control.HORIZONTAL_ALIGNMENT_CENTER:
				x = (width - textWidth) / 2;
				break;
		}

		if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
			context.shadowColor = this.shadowColor;
			context.shadowBlur = this.shadowBlur;
			context.shadowOffsetX = this.shadowOffsetX;
			context.shadowOffsetY = this.shadowOffsetY;
		}

		/*if (this.outlineWidth) {
			context.strokeText(text, this._currentMeasure.left + x, y);
		}*/

		if (text == undefined) return;

		const defaultFillStyle = context.fillStyle;
		const defaultFont = context.font;
		const defaultStrokeStyle = context.strokeStyle;
		const defaultLineWitdh = context.lineWidth;

		text.forEach((txt) => {
			if (txt.text == undefined) return;
			if (txt.ref.font == undefined) txt.ref.font = defaultFont;


			context.font = `${this.fontSize} ${txt.ref.font}`;
			context.fillStyle = txt.ref.color || defaultFillStyle;
			const measure = context.measureText(txt.text);

			context.lineWidth = Math.round(this.fontSizeInPixels * 0.05);
			context.lineCap = 'square';
			context.strokeStyle = context.fillStyle;

			if (txt.ref.underline) {
				context.beginPath();
				context.moveTo(this._currentMeasure.left + x, y + 3);
				context.lineTo(this._currentMeasure.left + x + measure.width, y + 3);
				context.stroke();
				context.closePath();
			}

			context.fillText(txt.text, this._currentMeasure.left + x, y);

			if (txt.ref.linethrough) {
				context.beginPath();
				context.moveTo(this._currentMeasure.left + x, y - this.fontSizeInPixels / 3);
				context.lineTo(this._currentMeasure.left + x + measure.width, y - this.fontSizeInPixels / 3);
				context.stroke();
				context.closePath();
			}

			context.font = defaultFont;
			context.strokeStyle = defaultStrokeStyle;
			context.lineWidth = defaultLineWitdh;

			const txtArea = { x1: this._currentMeasure.left + x, x2: this._currentMeasure.left + x + measure.width, y1: y, y2: y - this.fontSizeInPixels, text: txt.text, ref: txt.ref };
			newTextAreas.push(txtArea);

			x = x + measure.width;
		});

		context.fillStyle = defaultFillStyle;
		context.font = defaultFont;
		context.strokeStyle = defaultStrokeStyle;
		context.lineWidth = defaultLineWitdh;
	}

	/** @hidden */
	public _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>): void {
		context.save();

		this._applyStates(context);

		// Render lines
		this._renderLines(context);

		context.restore();
	}

	protected _applyStates(context: CanvasRenderingContext2D): void {
		super._applyStates(context);
	}

	protected _breakLines(refWidth: number, context: CanvasRenderingContext2D): IRefText[] {
		var lines = [];
		let textList: Array<Array<IRefText>> = [[]];

		this.text.forEach((val) => {
			let x = val.text.split('\n');

			if (x.length > 1) {
				textList[textList.length - 1].push({ text: x[0], ref: val });
				for (let y = 1; y < x.length; y++) {
					textList.push([{ text: x[y], ref: val }]);
				}
			} else textList[textList.length - 1].push({text: val.text, ref: val});
		});

		for (var _line of textList) {
			lines.push(...this._parseLineWordWrap(_line, refWidth, context));
		}

		return lines;
	}

	protected _parseLine(line: string = '', context: CanvasRenderingContext2D): object {
		return { text: line, width: context.measureText(line).width };
	}

	protected _parseLineWordWrap(line: Array<IRefText> = [], width: number, context: CanvasRenderingContext2D): object[] {
		var lines = [];
		var words = [];
		var textOnly = '';
		let defaultFont = this.fontFamily;

		line.forEach((val) => {
			if (val.ref.font == undefined) val.ref.font = defaultFont;
			let localWords = val.text.split(' ');
			localWords.forEach((x) => {
				if (x.length == 0) return;

				context.font = `${this.fontSize} ${val.ref.font}`;
				let metrics = context.measureText(x);
				context.font = defaultFont;

				if (metrics.width < width) words.push({ text: x + ' ', ref: val });
				else {
					const s1 = x.substring(0, Math.ceil(x.length / 2));
					const s2 = x.substring(Math.floor(x.length / 2));

					context.font = `${this.fontSize} ${val.ref.font}`;
					metrics = context.measureText(s1);
					let metrics2 = context.measureText(s2);
					context.font = defaultFont;

					if (metrics.width < width) words.push({ text: s1 + ' ', ref: val });
					else words.push({ text: ' [...] ', ref: val });
					if (metrics2.width < width) words.push({ text: s2 + ' ', ref: val });
					else words.push({ text: ' [...] ', ref: val });
				}
			});
			textOnly = textOnly + val.text;
		});

		var lineWidth = 0;

		context.font = `${this.fontSize} ${line[0].ref.font}`;
		let metrics = context.measureText(textOnly);
		context.font = defaultFont;

		if (metrics.width < width) {
			return [{ text: line, width: metrics.width }];
		}

		let lastText = '';
		let lastWidth = 0;
		let formatted: Array<IRefText> = [];

		for (var n = 0; n < words.length; n++) {
			let tempText = n == 0 ? words[0].text : lastText + words[n].text;

			context.font = `${this.fontSize} ${words[n].font}`;
			let metrics = context.measureText(tempText);
			context.font = defaultFont;

			if (metrics.width > width) {
				lines.push({ text: [...formatted], width: lastWidth });
				formatted = [];
				tempText = '';
				lastWidth = 0;
				for (let x = 0; x < n; x++) words.shift();
				n = -1;
			} else {
				lastText = tempText;
				lastWidth = metrics.width;
				formatted.push(words[n]);
			}
		}

		lines.push({ text: [...formatted], width: lastWidth });

		return lines;
	}

	protected _renderLines(context: CanvasRenderingContext2D): void {
		var height = this._currentMeasure.height;
		var rootY = 0;
		switch (this._textVerticalAlignment) {
			case Control.VERTICAL_ALIGNMENT_TOP:
				rootY = this._fontOffset.ascent;
				break;
			case Control.VERTICAL_ALIGNMENT_BOTTOM:
				rootY = height - this._fontOffset.height * (this._lines.length - 1) - this._fontOffset.descent;
				break;
			case Control.VERTICAL_ALIGNMENT_CENTER:
				rootY = this._fontOffset.ascent + (height - this._fontOffset.height * this._lines.length) / 2;
				break;
		}

		rootY += this._currentMeasure.top;

		const newTextAreas: ITextArea[] = [];

		for (let i = 0; i < this._lines.length; i++) {
			const line = this._lines[i];

			if (i !== 0 && this._lineSpacing.internalValue !== 0) {
				if (this._lineSpacing.isPixel) {
					rootY += this._lineSpacing.getValue(this._host);
				} else {
					rootY = rootY + this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
				}
			}

			this._drawText(line.text, line.width, rootY, context, newTextAreas);
			rootY += this._fontOffset.height;
		}

		this._textPos = newTextAreas;
	}

	/**
	 * Given a width constraint applied on the text block, find the expected height
	 * @returns expected height
	 */
	public computeExpectedHeight(): number {
		if (this.text && this.widthInPixels) {
			const context = document.createElement('canvas').getContext('2d');
			if (context) {
				this._applyStates(context);
				if (!this._fontOffset) {
					this._fontOffset = Control._GetFontOffset(context.font);
				}
				const lines = this._lines
					? this._lines
					: this._breakLines(this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels, context);

				let newHeight = this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * lines.length;

				if (lines.length > 0 && this._lineSpacing.internalValue !== 0) {
					let lineSpacing = 0;
					if (this._lineSpacing.isPixel) {
						lineSpacing = this._lineSpacing.getValue(this._host);
					} else {
						lineSpacing = this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
					}

					newHeight += (lines.length - 1) * lineSpacing;
				}

				return newHeight;
			}
		}
		return 0;
	}

	dispose(): void {
		super.dispose();

		this.onTextChangedObservable.clear();
	}

	public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, pi: PointerInfoBase): boolean {
		if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex, pi)) {
			return false;
		}
		return true;
	}
}
