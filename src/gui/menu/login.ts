import { clearAuthInfo, defaultValues, getAuthInfo, heartbeatServer, setAuthInfo } from '../../values';
import { SettingsGUI } from '../parts/settingsHelper';
import * as GUI from '@babylonjs/gui/';
import { PopupGUI } from '../parts/miniPopupHelper';
import { event, scale } from '../main';
import { createButton } from '../parts/menu';
import { FormTextBlock } from '../parts/formtextblock';
import { getAuthData } from '../../lib/helpers/storage';

type Indicator = { main: GUI.Rectangle; name: GUI.TextBlock; login: { button: GUI.Rectangle; buttonText: FormTextBlock } };
let accountIndicator: Indicator;

export function buildLoginOrPanel(openMenu, holder: GUI.Rectangle) {
	const tempHolder = new GUI.Rectangle();
	tempHolder.thickness = 0;
	tempHolder.isPointerBlocker = true;
	tempHolder.zIndex = 5;
	getAuthInfo() != null ? buildPanel(openMenu, tempHolder) : buildLogin(openMenu, tempHolder);
	return tempHolder;
}

export function createAccountIndicator(openMenu, holder): Indicator {
	const info = getAuthInfo();

	const main = new GUI.Rectangle();
	main.thickness = 0;
	main.isPointerBlocker = true;
	main.zIndex = 20;
	main.left = -scale * 2;
	main.top = scale * 2;
	main.verticalAlignment = 0;
	main.horizontalAlignment = 1;
	main.height = `${20 * scale}px`;
	main.width = `${120 * scale}px`;
	main.background = defaultValues.backgroundColor;

	const name = new GUI.TextBlock();
	name.color = 'white';
	name.fontSize = 7 * scale;
	name.textHorizontalAlignment = 0;
	name.text = info == null ? 'Not Logged!' : info.username;
	name.left = `${scale * 2}px`;

	main.addControl(name);

	const login = createButton(40, () => {
		openMenu('login');
	});
	login.buttonText.text = [{ text: info == null ? 'Login' : 'Account', color: 'white' }];
	login.button.horizontalAlignment = 1;
	login.button.verticalAlignment = 2;
	login.button.left = `-${scale * 2}px`;
	main.addControl(login.button);

	const scaleEvent = () => {
		login.button.left = `-${scale * 2}px`;
		name.left = `${scale * 2}px`;
		name.fontSize = 7 * scale;
		main.left = -scale * 2;
		main.top = scale * 2;
		main.height = `${20 * scale}px`;
		main.width = `${120 * scale}px`;
	};
	event.on('scale-change', scaleEvent);

	main.onDisposeObservable.add(() => {
		event.off('scale-change', scaleEvent);
	});

	accountIndicator = { main, name, login };
	return accountIndicator;
}

function buildLogin(openMenu, holder: GUI.Rectangle) {
	const main = new SettingsGUI('main', [{ text: 'Login into your account' }]);
	holder.addControl(main.main);

	main.createInput('username', 'Username/Email', '', ``, 'Enter your Username/Email');
	main.createInput('password', 'Password', '', ``, 'Enter your password', true);
	main.createSelectable('remember', (v) => `Remember login? ${v == 0 ? 'No' : 'Yes'}`, 0, [false, true]);
	main.createItem('loginButton', 'Login...', async () => {
		main.main.isVisible = false;
		const loggingin = new PopupGUI([{ text: 'Authentication' }]);
		loggingin.setCenterText([{ text: 'Logging in...' }]);
		holder.addControl(loggingin.main);
		const out = await (
			await fetch(heartbeatServer + '/api/login', {
				method: 'post',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: main.settings.username,
					password: main.settings.password,
				}),
			})
		).json();

		if (out.valid) {
			setAuthInfo(out, main.settings.remember == 1);
			loggingin.dispose();
			main.main.dispose();
			accountIndicator.name.text = out.username;
			accountIndicator.login.buttonText.text = [{ text: 'Account', color: 'white' }];
			buildPanel(openMenu, holder);
		} else {
			loggingin.setCenterText([{ text: out.reason }]);
			loggingin.createItem('Back', () => {
				loggingin.dispose();
				main.main.isVisible = true;
			});
		}
	});

	main.createLabel('feagea', '');
	main.createItem('info', 'Restore password', () => {
		window.open(heartbeatServer + '/user/restorepassword', '_blank');
	});
	main.createItem('info', 'Register new account', () => {
		window.open(heartbeatServer + '/user/login', '_blank');
	});

	main.createSettingButton('Back', () => {
		main.main.dispose();
		openMenu('main');
	});
}

function buildPanel(openMenu, holder: GUI.Rectangle) {
	const main = new SettingsGUI('main', [{ text: 'Account settings' }]);
	const auth = getAuthInfo();
	holder.addControl(main.main);

	main.createItem('skin', 'Change skin', () => {
		if (!main.lock) {
			main.lock = true;
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/png';
			input.click();
			const event = async () => {
				document.body.removeEventListener('focusin', event);
				if (input.files.length != 0) {
					main.main.isVisible = false;
					const uploadScreen = new PopupGUI([{ text: 'Uploading skin...' }]);
					uploadScreen.setCenterText([{ text: 'Connecting...' }]);
					holder.addControl(uploadScreen.main);

					let out;
					let status;
					try {
						out = await (
							await fetch(heartbeatServer + '/api/updateSkin', {
								method: 'post',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									loginToken: auth.token,
									skin: btoa(String.fromCharCode.apply(null, new Uint8Array(await input.files[0].arrayBuffer()))),
								}),
							})
						).json();

						if (out.error) {
							status = out.error;
						}
	
						if (out.success) {
							status = 'Your skin has been changed!';
						}
	
						uploadScreen.setCenterText([{ text: status }]);
						uploadScreen.createItem('Back', () => {
							uploadScreen.dispose();
							main.main.isVisible = true;
							main.lock = false;
						});
						
					} catch (e) {
						console.error(e);
						uploadScreen.setCenterText([{ text: 'Error accured while sending this file!' }]);
						uploadScreen.createItem('Back', () => {
							uploadScreen.dispose();
							main.main.isVisible = true;
							main.lock = false;
						});
					}

					
				}
			};

			document.body.addEventListener('focusin', event);
		}
	});

	main.createSettingButton('Logout', () => {
		main.main.dispose();
		clearAuthInfo();
		accountIndicator.name.text = 'Not logged!';
		accountIndicator.login.buttonText.text = [{ text: 'Login', color: 'white' }];
		openMenu('main');
	});

	main.createSettingButton('Back', () => {
		main.main.dispose();
		openMenu('main');
	});
}
