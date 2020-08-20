import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import * as GUI from '@babylonjs/gui';

let available = false;

let layer0: any;
let layer1: any;
let ui0: any;
let ui1: any;
let screen0: any;
let screen1: any;

export function constructScreen(noa) {
	const engine = noa.rendering.getEngine();

	layer0 = new BABYLON.Scene(engine);
	layer1 = new BABYLON.Scene(engine);

	ui0 = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', false, layer0, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	ui1 = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', false, layer1, BABYLON.Texture.NEAREST_SAMPLINGMODE);

	screen0 = new GUI.Rectangle();
	ui0.addControl(screen0);
	screen1 = new GUI.Rectangle();
	ui1.addControl(screen1);

	engine.onResizeObservable.add(() => {
		ui0.getContext().imageSmoothingEnabled = false;
		ui1.getContext().imageSmoothingEnabled = false;
	});

	ui0.getContext().imageSmoothingEnabled = false;
	ui1.getContext().imageSmoothingEnabled = false;

	console.log(ui0.samplingMode);

	layer0.autoClear = false;
	layer1.autoClear = false;

	const camera0 = new BABYLON.ArcRotateCamera(
		'Camera',
		-Math.PI / 2,
		(7 * Math.PI) / 16,
		10,
		BABYLON.Vector3.Zero(),
		layer0
	);
	const camera1 = new BABYLON.ArcRotateCamera(
		'Camera',
		-Math.PI / 2,
		(7 * Math.PI) / 16,
		10,
		BABYLON.Vector3.Zero(),
		layer1
	);

	available = true;

	noa.rendering._multiscenes.push(layer0);
	noa.rendering._multiscenes.push(layer1);
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
	else throw 'Invalid number';
}

export function getScreen(n: number) {
	if (!available) throw `UIs aren't initialized yet!`;

	if (n == 0) return screen0;
	else if (n == 1) return screen1;
	else throw 'Invalid number';
}

export class ShadowText {
	main: GUI.TextBlock;
	shadow: GUI.TextBlock;

	constructor(index: number) {
		this.main = new GUI.TextBlock();
		this.shadow = new GUI.TextBlock();
		this.main.zIndex = index + 1;
		this.shadow.zIndex = index;
	}

	set(item: string, value: any) {
		this.main[item] = value;
		this.shadow[item] = value;
	}
}
