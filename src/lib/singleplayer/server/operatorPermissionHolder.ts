import { PlayerPermissionHolder } from "voxelsrv-server/dist/lib/permissions";


export class OperatorPermissionHolder extends PlayerPermissionHolder {
	check(perm: string | string[]): null | boolean {
		return true;
	}

	checkStrict(perm: string | string[]): null | boolean {
		return true;
	}

}