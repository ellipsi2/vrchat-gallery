import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import got from 'got';
import HttpStatus from 'http-status-codes';
import {last, parseInt, range} from 'lodash-es';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCOUNT_HASH, cloudflare } from '$lib/server/secret';
import { v4 as uuid } from 'uuid';
import db from '$lib/database/instance';
import { aql } from 'arangojs';
import { namesParser } from '$lib/gallery/image';

async function requestNewDirectCreatorUploadLink(uploader: string, vrc: string, id?: string) {
    const body = new FormData();
    body.set('metadata', JSON.stringify({uploader}));
    if (typeof id === 'string') {
        body.set('id', id);
    }
    const r = await got.post(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`, {
        // @ts-ignore
        body,
        headers: {
            Authorization: `Bearer ${cloudflare}`
        }
    });

    const {result, success} = JSON.parse(r.body) as CloudflareDirectCreatorUploadRequestResult;

    if (!success) {
        throw error(500, 'Upload link request failure');
    }

    return result;
}

interface IUploadRequest {
    names: string[];
    timezone: string;
    title: string;
    description: string;
    tags: string[];
}

function isStringArray(expected: string[]) {
    return Array.isArray(expected) && expected.filter(v => typeof v !== 'string').length <= 0;
}

export const PUT: RequestHandler = async ({locals, url, request}) => {
    if (!locals.user) {
        throw error(401, 'Please login first');
    }

    if (locals.user.rank < 0) {
        throw error(HttpStatus.FORBIDDEN, 'You don\'t have permission to upload');
    }

    const {id, vrc} = locals.user;
    const count = parseInt(url.searchParams.get('count') ?? '1');

    const p = range(0, count).map(() => requestNewDirectCreatorUploadLink(id, vrc));

    const {names, timezone: tz, title, description, tags} = await request.json() as IUploadRequest;

    if (!isStringArray(names)) {
        throw error(HttpStatus.BAD_REQUEST, 'Invalid name values');
    }

    if (!isStringArray(tags)) {
        throw error(HttpStatus.BAD_REQUEST, 'Invalid tags');
    }

    if (typeof title !== 'string') {
        throw error(HttpStatus.BAD_REQUEST, 'Invalid title');
    }

    if (typeof description !== 'string') {
        throw error(HttpStatus.BAD_REQUEST, 'Invalid description');
    }

    const convertedDates = namesParser(names, tz).map(v => v.getTime());
        // .sort((a, b) => a.getTime() - b.getTime())
        // .map(v => v.toString());
    
        

    /*
    console.log(names, tz, title, description, tags);

    console.log(namesParser(names, tz));

    return json({}); 
    // */

    const settled = await Promise.allSettled(p);

    const generatedUniqueIds = (settled
        .filter(v => v.status === 'fulfilled') as PromiseFulfilledResult<Result>[])
        .map((v) =>  v.value.uploadURL)
        .map(v => last(v.split('/')));

    const gid = uuid();

    //*
    await db.query(aql`
    insert {
        id: ${gid},
        images: ${generatedUniqueIds},
        dates: ${convertedDates},
        owner: ${id},
        createdAt: DATE_NOW(),
        title: ${title.trim()},
        description: ${description.trim()},
        tags: ${tags.map(tag => tag.trim()).slice(0, 10)},
        public: false,
    } into images`); // */

    return json({
        images: generatedUniqueIds,
        id: gid,
    });
};

export const POST: RequestHandler = async ({locals, url}) => {
    if (!locals.user) {
        throw error(401, 'Please login first');
    }

    if (locals.user.rank < 0) {
        throw error(HttpStatus.FORBIDDEN, 'You don\'t have permission to upload');
    }

    const {id, vrc} = locals.user;

    const imageId = url.searchParams.get('id');

    if (!imageId) {
        throw error(HttpStatus.BAD_REQUEST, 'You must provide specific image id');
    }

    const cursor = await db.query(aql`
    for image in images
        filter contains(image.images, ${id})
        filter owner == ${id}
            return image`);

    if (!cursor.hasNext) {
        throw error(HttpStatus.NOT_FOUND, 'You have never uploaded such an image.');
    }

    return json({
        link: await requestNewDirectCreatorUploadLink(id, vrc, imageId),
    });
}

interface Result {
    id: string;
    uploadURL: string;
}

interface CloudflareDirectCreatorUploadRequestResult {
    result: Result /*{
        
        id: string;
        metadata: Record<string, string>;
        uploaded: string;
        requireSignedURLs: boolean;
        variants: string[];
        draft: boolean;
        
       id: string;
       uploadURL: string;
    };*/
    success: boolean;
    errors: any[];
    messages: any[];
}