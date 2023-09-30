import type { PageServerLoad } from './$types';

export const load = (async ({locals,}) => {
    const id = locals?.user?.id;
    return {id};
}) satisfies PageServerLoad;