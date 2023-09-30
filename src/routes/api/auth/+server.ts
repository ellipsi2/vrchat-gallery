import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { login, register } from '$lib/user/server';
import dayjs from 'dayjs';

export const POST: RequestHandler = async ({request, url, cookies}) => {
    const {id, pw} = await request.json();

    if (!id || !pw) {
        throw error(500, 'Invalid request');
    }

    const token = await login(id, pw);
    const expires = dayjs().add(1, 'y').toDate();
    
    cookies.set('token', token, {
        path: '/',
        expires,
        httpOnly: true,
        secure: false,
    });

    // throw redirect(HttpStatus.PERMANENT_REDIRECT as any, `/${id}`);

    return json({
        redir: `/${id}`,
    });
};

export const PUT: RequestHandler = async ({request}) => {
    const {id, pw, token} = await request.json();

    await register(token, id, pw);

    // throw redirect(HttpStatus.PERMANENT_REDIRECT as any, `/login`);

    return json({
        redir: '/login',
    });
};