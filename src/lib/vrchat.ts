import got from 'got';
import { cookie } from './server/secret';

export async function getVRCDisplayName(uid: string): Promise<string> {
    const r = await got.get(`https://vrchat.com/api/1/users/${uid}`, {
        headers: {
            cookie,
            'User-Agent': 'VRC Gallery/0.1.0 (Macintosh; OS X/13.4.0) GCDHTTPRequest'
        },

    });

    const data = JSON.parse(r.body);

    // console.log(data)

    return data.displayName;
}