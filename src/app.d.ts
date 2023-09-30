// See https://kit.svelte.dev/docs/types#app

import type { IUser } from '$lib/user/shared';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: IUser;
            locale: string;
            script: string;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
