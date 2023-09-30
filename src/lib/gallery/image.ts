import type { IArangoDocumentIdentifier } from '$lib/database';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface IImage extends IArangoDocumentIdentifier {
    owner: string;
    size: {x: number, y: number};
}

export function namesParser(names: string[], tz: string): Date[] {
    return names.map((name) => {
        const re = /VRChat_(\d+)-(\d+)-(\d+)_(\d+)-(\d+)-(\d+).(\d+)/gm;
        const r = re.exec(name);
        if (!r) {
            return new Date(0);
        }
        const y = r[1];
        const m = r[2];
        const d = r[3];
        const h = r[4];
        const min = r[5];
        const s = r[6];
        const ms = r[7];
        // @ts-ignore
        return dayjs.tz(`${y}-${m}-${d}T${h}:${min}:${s}.${ms}`, tz).utc().toDate();
    });
}