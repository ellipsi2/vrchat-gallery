import db from '$lib/database/instance';
import { aql } from 'arangojs';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import HttpStatus from 'http-status-codes';

export const load = (async ({params, locals}) => {
    const cursor = await db.query(aql`
        for image in images
            filter image.owner == ${params.id}
            filter image.id == ${params.image}
                return image`);
    if (!cursor.hasNext) {
        throw error(HttpStatus.NOT_FOUND);
    }

    const image = await cursor.next();

    if (!image.public) {
        if (locals.user.id !== image.owner) {
            throw error(HttpStatus.NOT_FOUND);
        } else {
            await db.query(aql`
                let img = document(${image._id})
                update img with {public: true} in images`);
        }
    }
    
    return {...image, isOwner: image.owner === locals?.user?.id};
}) satisfies PageServerLoad;