import db from '$lib/database/instance';
import { aql } from 'arangojs';

export async function nextImages(last: number, owner: string) {
    console.log(last, owner);
    const cursor0 = await db.query(aql`
    let imgs = (for image in images filter image.owner == ${owner} && LENGTH(image.images) > 0 && image.public == true return image)
    let prevs = ${last} <= 0 ? [] : (for image in imgs filter TO_NUMBER(image._key) >= ${last} return image)
    return {max: LENGTH(imgs), prev: LENGTH(prevs)}`);

    const counts = await cursor0.next();

    const cursor = await db.query(aql`
    let imgs = (for image in images filter image.owner == ${owner} && length(image.images) > 0 && image.public == true return image)
    let len = LENGTH(imgs)
    let results = (for image in imgs
        sort image.createdAt desc
        filter ${last} <= 0 ? true : TO_NUMBER(image._key) < ${last}
            limit 15
            let unsortedDates = image.dates ? image.dates : []
            let dates = (for date in unsortedDates sort date asc return date)
            let earliest = first(dates)
            let lastest = last(dates)
            return {
                _key: image._key,
                id: image.id,
                preview: image.images[0],
                length: length(image.images),
                dates: [earliest, lastest],
                title: has(image, 'title') ? (length(image.title) > 0 ? image.title : '') : ''
            })
    return results`);
    const images = await cursor.next();

    return {counts, images};
}