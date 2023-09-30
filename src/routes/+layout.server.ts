import type { LayoutServerLoad } from './$types';

export const load = (async ({request, cookies, locals}) => {
    // console.log(locals)
    return {locale: locals.locale, script: locals.script, user: locals?.user?.id};
}) satisfies LayoutServerLoad;