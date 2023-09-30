import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import HttpStatus from 'http-status-codes';
import db from '$lib/database/instance';
import { aql } from 'arangojs';

export const GET: RequestHandler = async () => {
    return new Response();
};

export const PUT: RequestHandler = async ({request, locals}) => {
    if (!locals.user) {
        throw error(HttpStatus.UNAUTHORIZED);
    }

    const {path, current, correct} = await request.json() as ITranslationReportBody;

    const save = {
        proponent: locals.user.id,
        type: 'translation',
        path,
        current,
        correct,
        locale: locals.locale,
        script: locals.script,
        createdAt: Date.now(),
    };

    await db.query(aql`insert ${save} into reports`);

    return new Response(undefined, {
        status: HttpStatus.CREATED,
    });
}

interface ITranslationReportBody {
    path: string[];
    current: string;
    correct: string;
}