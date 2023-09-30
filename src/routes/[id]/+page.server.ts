import db from '$lib/database/instance';
import { aql } from 'arangojs';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import HttpStatus from 'http-status-codes';
import { nextImages } from '$lib/gallery/server/image';

async function getAllUserNames(): Promise<{name: string, id: string}[]> {
    const cursor = await db.query(aql`
        for user in users
            return {name: user.name, id: user.id}`);
    return await cursor.all();
}

function tryParseInt(value: string | null | undefined, def: number): number {
    try {
        return parseInt(value ?? def.toString());
    } catch {
        return def;
    }
}

export const load = (async ({params, locals, url}) => {
    const name = await getUserName(params.id);
    const page = tryParseInt(url.searchParams.get('page'), -1);

    const {images, counts} = await nextImages(page, params.id);

    return {
        manage: locals?.user?.id === params.id,
        name,
        images,
        counts,
        users: await getAllUserNames(),
    };
}) satisfies PageServerLoad;

async function getUserName(id: string) {
    const cursor = await db.query(aql`
        for user in users
            filter user.id == ${id}
                return user.name`);
    if (!cursor.hasNext)
        throw error(HttpStatus.NOT_FOUND, 'User not found');
    return await cursor.next();
}