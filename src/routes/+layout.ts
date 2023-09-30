import type { LayoutLoad } from './$types';
import { loadTranslations } from '$lib/i18n';
import { browser } from '$app/environment';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(LocalizedFormat);

export const load = (async ({parent, url, data}) => {
    await parent();

    const {pathname} = url;

    let locale = data.locale;

    // console.log(data.script);
    
    // for chinese script selectioin hack(?)
    if (data.script) {
        locale = `${locale}-${data.script}`;
    } else if (locale === 'zh' && !data.script) {
        locale = 'zh-Hans';
    }

    if (locale.length > 3 && !locale.startsWith('zh')) {
        locale = locale.split('-')[0];
    }
    
    await loadTranslations(locale, pathname);

    let dayjsLocale: Locale;
    switch (locale) {
        case 'ko': dayjsLocale = (await import(`dayjs/locale/ko`)).default; break;
        case 'es': dayjsLocale = (await import(`dayjs/locale/es`)).default; break;
        case 'zh':
        case 'zh-Hans':
        case 'zh-Hant':
            // console.log(locale)
            if (data.script === 'Hant' || locale === 'zh-Hant') {
                dayjsLocale = (await import('dayjs/locale/zh-tw')).default;
                locale = 'zh-tw';
            } else {
                dayjsLocale = (await import('dayjs/locale/zh')).default;
                locale = 'zh';
            }
            break;
        case 'ja':
            dayjsLocale = (await import('dayjs/locale/ja')).default; break;
        case 'id':
            dayjsLocale = (await import('dayjs/locale/id')).default; break;
        default: 
            dayjsLocale = (await import(`dayjs/locale/en`)).default; break;
    }

    // console.log(data.locale, dayjsLocale);

    // @ts-ignore
    dayjs.locale(dayjsLocale, null, true);
    dayjs.locale(locale);

    // console.log('data:', data);
    if (data.user) {
        return {user: data.user}
    }

    return {};
}) satisfies LayoutLoad;