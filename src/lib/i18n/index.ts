import i18n from 'sveltekit-i18n';
import type {Config} from 'sveltekit-i18n';
import { lang } from './lang';

function makes(key: string, ...locales: string[]) {
    return locales.map(locale => {
        return {
            locale,
            key,
            loader: async () => (await import(`./${locale}/${key}.yml`)).default,
        };
    });
}

const supportedLanguages = [
    'ko',
    'en',
    'es',
    'zh-Hans',
    'zh-Hant',
    'ja',
    'id',
];

const translations: Record<string, {lang: typeof lang}> = {};

for (const locale of supportedLanguages) {
    translations[locale] = {lang};
}

const config: Config = ({
    translations,
    loaders: [
        ...makes('common', ...supportedLanguages),
        ...makes('manage', ...supportedLanguages),
        ...makes('upload', ...supportedLanguages),
        ...makes('report', ...supportedLanguages),
    ],
    fallbackLocale: 'en',
});

export const {t, locale, locales, loading, loadTranslations, setLocale} = new i18n(config);