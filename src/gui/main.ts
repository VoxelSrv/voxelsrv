import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import * as GUI from '@babylonjs/gui';
import { EventEmitter } from 'events';

export const event = new EventEmitter();

let available = false;

let layer0: any;
let layer1: any;
let ui0: any;
let ui1: any;
let screen0: GUI.Rectangle;
let screen1: GUI.Rectangle;
export let engine: any;

export let scale = 3;
export function setScale(x: number) {
	scale = x;
	event.emit('scale-change', x);
}

export function getEngine() {
	return engine;
}

window['scale'] = setScale;

export function constructScreen(noa) {
	engine = noa.rendering.getEngine();
	const scene = noa.rendering.getScene();

	layer0 = new BABYLON.Scene(engine);

	ui0 = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	ui1 = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', false, layer0, BABYLON.Texture.NEAREST_SAMPLINGMODE);

	screen0 = new GUI.Rectangle();
	screen0.isPointerBlocker = false;
	screen0.zIndex = 1000;
	ui0.addControl(screen0);
	screen1 = new GUI.Rectangle();
	screen1.isPointerBlocker = false;
	screen1.zIndex = 1000;
	ui1.addControl(screen1);

	engine.onResizeObservable.add((x) => {
		ui0.getContext().imageSmoothingEnabled = false;
		ui1.getContext().imageSmoothingEnabled = false;
		event.emit('resize', x);
		setTimeout(() => {
			event.emit('scale-change', scale);
		}, 50);
	});

	ui0.getContext().imageSmoothingEnabled = false;
	ui1.getContext().imageSmoothingEnabled = false;

	layer0.autoClear = false;

	const camera1 = new BABYLON.ArcRotateCamera('Camera', -Math.PI / 2, (7 * Math.PI) / 16, 10, BABYLON.Vector3.Zero(), layer0);

	available = true;

	noa.rendering._multiscenes.push(layer0);
}

export function getLayer(n: number) {
	if (!available) throw `Scenes aren't initialized yet!`;

	if (n == 0) return layer0;
	//else if (n == 1) return layer1;
	else throw 'Invalid number';
}

export function getUI(n: number) {
	if (!available) throw `UIs aren't initialized yet!`;

	if (n == 0) return ui0;
	else if (n == 1) return ui1;
	else throw 'Invalid number';
}

export function getScreen(n: number) {
	if (!available) throw `UIs aren't initialized yet!`;

	if (n == 0) return screen0;
	else if (n == 1) return screen1;
	else throw 'Invalid number';
}
