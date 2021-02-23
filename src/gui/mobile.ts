import { getScreen, getUI } from './main';

export function setupMobile(noa) {
	console.log('Using mobile controls');

	const ui = getScreen(2);
	const layer = getUI(2);

	let timer: number = 0;
	let touchTime: number = 0;
	let isTouching: boolean = false;
	let loop = null;
	let breaking = null;
	const maxDiff = 50;

	let oldMovePos: [number, number] = [0, 0];

	noa.container.canvas.ontouchstart = function (ev) {
		oldMovePos = [ev.clientX, ev.clientY];
		if (ev.target != noa.container.canvas) return;

		ev.preventDefault();
		if (loop != null) {
			clearInterval(loop);
			clearInterval(breaking);
		}
		isTouching = true;
		touchTime = new Date().getTime() / 1000;
		loop = setInterval(function () {
			timer = new Date().getTime() / 1000 - touchTime;
		}, 2);
		breaking = setInterval(function () {
			if (timer > 0.7) {
				noa.inputs.down.emit('fire');
			}
		}, 400);
	};

	noa.container.canvas.ontouchmove = function (ev) {
		ev.preventDefault();

		let x = Math.abs(oldMovePos[0] - ev.targetTouches[0].clientX);
		let y = Math.abs(oldMovePos[1] - ev.targetTouches[0].clientY);

		if (x > 3 || y > 3) touchTime = new Date().getTime() / 1000 + 0.5;

		oldMovePos = [ev.targetTouches[0].clientX, ev.targetTouches[0].clientY];
	};

	noa.container.canvas.ontouchend = function (ev) {
		if (ev.target != noa.container.canvas) return;

		ev.preventDefault();

		if (0 <= timer && timer < 0.7) {
			noa.inputs.down.emit('alt-fire');
		}
		if (loop != null) {
			clearInterval(loop);
			clearInterval(breaking);
		}

		isTouching = false;
		timer = 0;
	};

	noa.container.canvas.ontouchcancel = function (ev) {
		if (ev.target != noa.container.canvas) return;

		ev.preventDefault();

		if (loop != null) {
			clearInterval(loop);
			clearInterval(breaking);
		}

		isTouching = false;
		timer = 0;
	};

	const controls = document.createElement('div');
	controls.id = 'game_mobile_controls';
	controls.classList.add('game_mobile');

	document.body.appendChild(controls);

	let dragStart = null;
	let currentPos = { x: 0, y: 0 };

	// Joystick implementation is based on one by u/AndrewGreenh

	var stick = document.createElement('div');
	stick.id = 'game_mobile_joystick';

	stick.ontouchstart = function (event) {
		if (event.target != stick) return;

		event.preventDefault();

		stick.style.transition = '0s';
		if (event.changedTouches) {
			dragStart = {
				x: event.targetTouches[0].clientX,
				y: event.targetTouches[0].clientY,
			};
			return;
		}
		dragStart = {
			x: event.targetTouches[0].clientX,
			y: event.targetTouches[0].clientY,
		};
	};
	stick.ontouchmove = function (event) {
		if (event.target != stick) return;

		if (dragStart === null) return;
		event.preventDefault();
		const xDiff = event.targetTouches[0].clientX - dragStart.x;
		const yDiff = event.targetTouches[0].clientY - dragStart.y;
		const angle = Math.atan2(yDiff, xDiff);
		const distance = Math.min(maxDiff, Math.hypot(xDiff, yDiff));
		const xNew = distance * Math.cos(angle);
		const yNew = distance * Math.sin(angle);
		stick.style.transform = 'translate(' + (xNew + 16) + 'px, ' + (yNew + 16) + 'px)';
		currentPos = { x: xNew, y: yNew };
		applyMove(xNew, yNew);
	};
	stick.ontouchend = function (event) {
		if (event.target != stick) return;

		event.preventDefault();

		if (dragStart === null) return;
		stick.style.transition = '.1s';
		stick.style.transform = 'translate(16px, 16px)';
		dragStart = null;
		currentPos = { x: 0, y: 0 };
		applyMove(0, 0);
	};

	controls.appendChild(stick);

	function applyMove(x, y) {
		x = Math.round(x / maxDiff);
		y = Math.round(y / maxDiff);

		if (y == 0) {
			noa.inputs.state.forward = false;
			noa.inputs.state.backward = false;
		} else if (y > 0) {
			noa.inputs.state.forward = false;
			noa.inputs.state.backward = true;
		} else if (y < 0) {
			noa.inputs.state.forward = true;
			noa.inputs.state.backward = false;
		}

		if (x == 0) {
			noa.inputs.state.left = false;
			noa.inputs.state.right = false;
		} else if (x > 0) {
			noa.inputs.state.left = false;
			noa.inputs.state.right = true;
		} else if (x < 0) {
			noa.inputs.state.left = true;
			noa.inputs.state.right = false;
		}
	}

	var jump = document.createElement('div');
	jump.id = 'game_mobile_jump';
	jump.classList.add('game_mobile');

	jump.ontouchstart = function () {
		noa.inputs.state.jump = true;
	};

	jump.ontouchend = function () {
		noa.inputs.state.jump = false;
	};
	jump.ontouchcancel = function () {
		noa.inputs.state.jump = false;
	};

	document.body.appendChild(jump);

	var topButtons = document.createElement('div');
	topButtons.id = 'game_mobile_topbuttons';
	topButtons.classList.add('game_mobile');
	document.body.appendChild(topButtons);

	var chat = document.createElement('div');
	chat.id = 'game_mobile_chat';
	chat.innerHTML = '';

	chat.ontouchstart = function (ev) {
		ev.preventDefault();
		noa.inputs.down.emit('chat');
	};

	topButtons.appendChild(chat);

	var menu = document.createElement('div');
	menu.id = 'game_mobile_menu';

	menu.ontouchstart = function (ev) {
		ev.preventDefault();
		noa.inputs.down.emit('menu');
	};

	topButtons.appendChild(menu);

	hideMobileControls(false);
}


export function hideMobileControls(ignoreTop: boolean) {
	const elements = document.getElementsByClassName('game_mobile');

	for (let x = 0; x < elements.length; x++) {
		if (ignoreTop && elements.item(x).id == 'game_mobile_topbuttons') {
			continue;
		}

		// @ts-ignore
		elements.item(x).style.display = 'none';
	}
}

export function showMobileControls(ignoreTop: boolean) {
	const elements = document.getElementsByClassName('game_mobile');

	for (let x = 0; x < elements.length; x++) {
		if (ignoreTop && elements.item(x).id == 'game_mobile_topbuttons') {
			continue;
		}

		// @ts-ignore
		elements.item(x).style.display = 'block';
	}}
