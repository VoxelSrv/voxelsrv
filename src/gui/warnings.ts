import { isFirefox } from 'mobile-device-detect';

export function getWarning() {
	const warnings = [];

	if (isFirefox) {
		warnings.push({ text: 'Warning! Performence of JS on Firefox is decreased compared to Chromium-based browsers!\n' });
	}

	if (location.protocol == 'https:') {
		warnings.push({ text: 'Using HTTPS connection! Some multiplayer servers might not work!\n' });
	}
	
	
	return warnings;
}
