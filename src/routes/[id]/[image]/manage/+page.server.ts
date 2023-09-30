import type { PageServerLoad } from './$types';
import {load as parentLoad} from '../+page.server';
import { error } from '@sveltejs/kit';
import HttpStatus from 'http-status-codes';

export const load = (async (event) => {
    const {locals, params} = event;
    
    if (locals.user.rank < 10) {
        if (locals.user.id !== params.id) {
            throw error(HttpStatus.FORBIDDEN);
        }
    }

    return {
        parent: await parentLoad(event as any),
    };
}) satisfies PageServerLoad;