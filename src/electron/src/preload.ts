import { IpcRenderer, ipcRenderer, shell } from 'electron';
declare const window: Window & { electron: IpcRenderer };

window.electron = ipcRenderer;

window.open = (url?: string, target?: string, features?: string, replace?: boolean) => {
	shell.openExternal(url);
	return null;
};
