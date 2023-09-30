import db from '$lib/database/instance';
import { aql } from 'arangojs';
import type { LayoutServerLoad } from './$types';


export const load = (async ({parent}) => {
    return {
        ...await parent(),
    };
}) satisfies LayoutServerLoad;