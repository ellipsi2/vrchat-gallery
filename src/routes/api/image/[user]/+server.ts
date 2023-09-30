import db from '$lib/database/instance';
import { aql } from 'arangojs';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import HttpStatus from 'http-status-codes';
import { existsId } from '$lib/user/server';
import {parseInt as p} from 'lodash-es';
import { nextImages } from '$lib/gallery/server/image';

function parseInt(s: string | null, d: number): number {
    if (!s) {
        return d;
    }
    try {
        return p(s);
    } catch {
        return d;
    }
}

export const GET: RequestHandler = async ({params, url}) => {
    if (!await existsId(params.user)) {
        throw error(HttpStatus.NOT_FOUND);
    }

    const last = parseInt(url.searchParams.get('last'), -1);

    const {images, counts} = await nextImages(last, params.user);

    return json({
        images,
        counts,
    });
};