import { CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
import { cloudflare } from '$lib/server/secret';
import got from 'got';
import type { CloudflareRequestResult } from './type';

export async function listAll(): Promise<CloudflareRequestResult<ICloudflareListImageResult>> {
    const r = await got.get(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1?per_page=10000`, {
        // @ts-ignore
        headers: {
            Authorization: `Bearer ${cloudflare}`
        }
    });

    return JSON.parse(r.body);
}

export interface ICloudflareListImageResult {
    images: ICloudflareImage[];
}

interface ICloudflareImage {
    filename: string;
    id: string;
    meta: {[key: string]: string};
    requiredSignedURLs: boolean;
    uploaded: string;
    variants: string[];
}