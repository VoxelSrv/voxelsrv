import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import * as GUI from '@babylonjs/gui';
import { EventEmitter } from 'events';

export const event = new EventEmitter();
event.setMaxListeners(100);

let available = false;

let layer0: BABYLON.Scene;
let layer1: BABYLON.Scene;
let ui0: GUI.AdvancedDynamicTexture;
let ui1: GUI.AdvancedDynamicTexture;
let ui2: GUI.AdvancedDynamicTexture;
let screen0: GUI.Rectangle;
let screen1: GUI.Rectangle;
let screen2: GUI.Rectangle;
export let engine: BABYLON.Engine;

export let scale = 3;
export let maxScale = 3;
export function setScale(x: number) {
	maxScale = x;
	let y = updateScale();
	setTimeout(() => {
		event.emit('scale-change', y);
	}, 100);
}

function updateScale() {
	const width = window.innerWidth;
	let pScale;
	if (width >= 2000) pScale = 5;
	else if (width >= 1500) pScale = 4;
	else if (width >= 900) pScale = 3;
	else if (width >= 450) pScale = 2;
	else pScale = 1;

	if (pScale > maxScale) scale = maxScale;
	else scale = pScale;

	return pScale > maxScale ? maxScale : pScale;
}

export function getEngine() {
	return engine;
}

window['scale'] = setScale;

export function constructScreen(noa) {
	const scene = noa.rendering.getScene();
	engine = scene.getEngine();

	layer0 = new BABYLON.Scene(engine);
	layer1 = new BABYLON.Scene(engine);

	ui0 = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	ui1 = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', false, layer0, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	ui2 = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', false, layer1, BABYLON.Texture.NEAREST_SAMPLINGMODE);

	//ui1.renderScale = 0.5;

	screen0 = new GUI.Rectangle();
	screen0.thickness = 0;
	screen0.isPointerBlocker = false;
	screen0.zIndex = 1000;
	ui0.addControl(screen0);

	screen1 = new GUI.Rectangle();
	screen1.thickness = 0;
	screen1.isPointerBlocker = false;
	screen1.zIndex = 1000;
	ui1.addControl(screen1);

	screen2 = new GUI.Rectangle();
	screen2.thickness = 0;
	screen2.isPointerBlocker = false;
	screen2.zIndex = 1000;
	ui2.addControl(screen2);

	engine.onResizeObservable.add((x) => {
		ui0.getContext().imageSmoothingEnabled = false;
		ui1.getContext().imageSmoothingEnabled = false;
		ui2.getContext().imageSmoothingEnabled = false;
		event.emit('resize', x);
		updateScale();
		setTimeout(() => {
			event.emit('scale-change', scale);
		}, 50);
	});

	ui0.getContext().imageSmoothingEnabled = false;
	ui1.getContext().imageSmoothingEnabled = false;
	ui2.getContext().imageSmoothingEnabled = false;

	layer0.autoClear = false;
	layer1.autoClear = false;

	new BABYLON.ArcRotateCamera('Camera', -Math.PI / 2, (7 * Math.PI) / 16, 10, BABYLON.Vector3.Zero(), layer0);
	new BABYLON.ArcRotateCamera('Camera', -Math.PI / 2, (7 * Math.PI) / 16, 10, BABYLON.Vector3.Zero(), layer1);

	available = true;

	noa.on('afterRender', () => {
		layer0.render();
		layer1.render();
	})

	updateScale();
}

export function getLayer(n: number) {
	if (!available) throw `Scenes aren't initialized yet!`;

	if (n == 0) return layer0;
	else if (n == 1) return layer1;
	else throw 'Invalid number';
}

export function getUI(n: number) {
	if (!available) throw `UIs aren't initialized yet!`;

	if (n == 0) return ui0;
	else if (n == 1) return ui1;
	else if (n == 2) return ui2;
	else throw 'Invalid number';
}

export function getScreen(n: number) {
	if (!available) throw `UIs aren't initialized yet!`;

	if (n == 0) return screen0;
	else if (n == 1) return screen1;
	else if (n == 2) return screen2;
	else throw 'Invalid number';
}
