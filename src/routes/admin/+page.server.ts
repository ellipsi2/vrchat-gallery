import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import HttpStatus from 'http-status-codes';
import { getVRCDisplayName } from '$lib/vrchat';
import { newToken } from '$lib/user/server';

const whitelist = [
    '127.0.0.1',
    'localhost',
    '192.168.0.3',
]

export const load = (async ({getClientAddress}) => {
    const cip = getClientAddress();
    if (!whitelist.includes(cip)) {
        throw error(HttpStatus.NOT_FOUND, 'Not Found');
    }
    return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async ({request}) => {
        const data = await request.formData();

        if (!data.has('uid')) {
            throw error(HttpStatus.BAD_REQUEST);
        }

        const uid = data.get('uid');

        if (!uid || uid.length <= 0) {
            throw error(HttpStatus.BAD_REQUEST);
        }

        const check = data.has('check');

        
        if (check) {
            try {
                const displayName = await getVRCDisplayName(uid.toString());

                return {
                    displayName,
                }
            } catch {
                return {
                    displayName: '<ERROR>'
                }
            }
        } else {
            const displayName = data.get('displayName')!.toString();
            const token = newToken(uid.toString(), displayName);

            return {token};
        }
    }
};
