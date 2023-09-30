import db from '$lib/database/instance';
import { aql } from 'arangojs';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import HttpStatus from 'http-status-codes';

export const GET: RequestHandler = async () => {
    return json({});
};

export const POST: RequestHandler = async ({request, locals}) => {
    if (!locals.user) {
        throw error(HttpStatus.UNAUTHORIZED);
    }

    const {
        title,
        description,
        tags,
        id
    } = await request.json() as Partial<IEditRequest> & {id: string};

    if (typeof title === 'string' && title.trim().length > 0) {
        await db.query(aql`
            for image in images
                filter image.owner == ${locals.user.id}
                filter image.id == ${id}
                    update image with {
                        title: ${title.trim()}
                    } in images`);
    }

    if (typeof description === 'string' && description.trim().length > 0) {
        await db.query(aql`
            for image in images
                filter image.owner == ${locals.user.id}
                filter image.id == ${id}
                    update image with {
                        description: ${description.trim()}
                    } in images`);
    }

    if (Array.isArray(tags) && tags.filter(v => typeof v !== 'string').length <= 0) {
        await db.query(aql`
            for image in images
                filter image.owner == ${locals.user.id}
                filter image.id == ${id}
                    update image with {
                        tags: ${tags.map(v => v.trim()).filter(v => v.length > 0).slice(0, 10)}
                    } in images`);
    }

    return new Response(undefined, {
        status: HttpStatus.ACCEPTED,
    });
};

interface IEditRequest {
    title: string;
    description: string;
    tags: string[];
}