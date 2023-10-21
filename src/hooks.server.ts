import { key } from '$lib/server/secret';
import type { IUser } from '$lib/user/shared';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import njwt from 'njwt';
import { isEmpty } from 'lodash-es';
import alParser from 'accept-language-parser';
import dayjs from 'dayjs';

import {listAll} from '$lib/cloudflare/list';
import db from '$lib/database/instance';
import { aql } from 'arangojs';

import {writeFileSync} from 'node:fs';

let imageIds: string[] = [];

const validateAllImages = (async ({event, resolve}) => {
    const a = await listAll();
    if (a.success) {
        const {images} = a.result;
        imageIds = images.map(v => v.id);
    }

    // writeFileSync('./test.txt', imageIds.join('\n'));

    const cursor = await db.query(aql`
        let storedImages = FLATTEN(for image in images return image.images)
        let allSavedImages = ${imageIds}
        for image in images
            let invalidImages = (for id in image.images
                filter id not in allSavedImages
                    return id)
            filter LENGTH(invalidImages) > 0
                return image`);
    const invalids = await cursor.all();


    console.log(invalids.map(v => `${v.owner}/${v.id}`));

    return resolve(event);
}) satisfies Handle;

const auth = (async ({event, resolve}) => {
    const token = event.cookies.get('token');

    if (token) {
        try {
            const jwt = njwt.verify(token, key);
        
            if (jwt) {
                const body = jwt.body.toJSON() as unknown as IUser;

                event.locals.user = body;
            }
        } catch {
            // @ts-ignore
            delete event.locals.user;
        }
    }

    return resolve(event);
}) satisfies Handle;

const locale = (async ({event, resolve}) => {
    const acceptLanguages = alParser.parse(event.request.headers.get('accept-language') ?? undefined);
    const prefers = acceptLanguages.sort((a, b) => b.quality - a.quality);
    const prefer = isEmpty(prefers) ? 'en' : prefers[0].code;

    // console.log(prefers)

    const locale = event.cookies.get('locale');

    if (!locale) {
        event.cookies.set('locale', prefer, {
            path: '/',
            expires: dayjs().add(1, 'year').toDate(),
            httpOnly: false,
            secure: false,
        });
        event.locals.locale = prefer;
    } else {
        event.locals.locale = locale;
    }

    let script = prefers?.[0]?.script ?? prefers?.[0]?.region;

    if (script) {
        if (script === 'TW') {
            script = 'Hant';
        }

        event.locals.script = script;
    }

    const dark = event.cookies.get('dark');

    return resolve(event, {
        transformPageChunk: ({html}) => {
            return html
                .replace('<>LANG<>', !locale ? prefer : locale)
                .replace('@THEME@', dark ? ' class="dark"' : '');
        }
    });
}) satisfies Handle;

export const handle = sequence(validateAllImages, auth, locale);