import dayjs from 'dayjs';
import type { PageServerLoad } from './$types';

export const load = (async ({locals, cookies, url}) => {
    const lang = url.searchParams.get('lang');
    if (lang) {
        cookies.set('locale', lang, {
            path: '/',
            expires: dayjs().add(1, 'year').toDate(),
            httpOnly: false,
            secure: false,
        });
    }
    const userId = locals?.user?.id;
    return {userId};
}) satisfies PageServerLoad;