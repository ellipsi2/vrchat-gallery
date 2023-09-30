import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/database/instance';
import { aql } from 'arangojs';
import { findDuplicateImages } from '$lib/gallery/conflict';
import HttpStatus from 'http-status-codes';
import { namesParser } from '$lib/gallery/image';

const noConflicts = {
    conflicts: [],
};

export const GET: RequestHandler = async ({locals}) => {
    if (!locals.user) {
        return json(noConflicts);
    }

    const cursor = await db.query(aql`
        for image in images
            return {images: image.images, id: image.id}`);

    if (!cursor.hasNext) {
        return json(noConflicts);
    }

    const ownImages = await cursor.all() as {images: string[], id: string}[];

    const conflicts = findDuplicateImages(ownImages);

    return json({conflicts});
};

export const POST: RequestHandler = async ({locals, request}) => {
    if (!locals.user) {
        throw error(HttpStatus.UNAUTHORIZED);
    }

    const {times} = await request.json() as {times: number[]};

    const checkForConflict = times.map((time) => new Date(time));

    //*
    const cursor = await db.query(aql`
    let cc = ${checkForConflict}
    for image in images
        filter IS_ARRAY(image.dates)
            let c = (for date in image.dates return position(cc, date))
            filter count(for b in c filter b return b) > 0
                return image.id`);

        // */

    const conflicts = await cursor.all();

    return json({
        conflicts,
    });
}