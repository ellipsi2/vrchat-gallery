<script lang="ts">
	import type { PageData } from './$types';
    import MdList from 'svelte-icons/md/MdList.svelte'
    import {t, locale, locales, setLocale} from '$lib/i18n';
	import {
		Listbox,
		ListboxButton,
		ListboxOptions,
		ListboxOption
	} from '@rgossiaux/svelte-headlessui';
	import { onMount } from 'svelte';
	// import type { CookieStore } from 'cookie-store';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	export let data: PageData;
    const langs = $locales
        // .filter(locale => locale !== 'default')
        .map(locale => ({id: locale, name: $t(`lang.${locale}`), unavailable: false}))!;


	let selectedLang = langs.find(v => v.id === $locale) ?? langs.find(v => v.id === 'en')!;

    const lang = $page.url.searchParams.get('lang');
    if (lang) {
        setLocale(lang)?.then();
    }

    onMount(() => {
        /*
        if (!Object.hasOwn(window, 'cookieStore')) {
            import('cookie-store').then(({cookieStore}) => {
                window.cookieStore = cookieStore;
            });
        }*/
    });

    // @ts-ignore
    // declare var cookieStore: CookieStore;
    async function save() {
        await goto(`${$page.url.pathname}?lang=${selectedLang.id}`, {
            replaceState: true,
        });
        location.reload();
    }

</script>

<svelte:head>
    <title>
        {$t('common.settings')} - vrc.vg
    </title>
</svelte:head>

<div class="h-dyn-screen flex flex-row items-center">
    <div class="p-4 flex flex-col gap-2 w-11/12 sm:w-4/6 md:w-1/2 lg:w-1/3 mx-auto ring-1 ring-zinc-200 bg-zinc-50 rounded-md">
        <div class="pb-4">
            Darkmode
        </div>

        <Listbox class="relative shadow-md bg-white rounded-md flex flex-col items-center" bind:value={selectedLang}>
            <ListboxButton class="flex flex-row justify-between w-full items-center px-4 py-2">
                {selectedLang.name}
                <span class="w-4 inline-block"><MdList /></span>
            </ListboxButton>
            <ListboxOptions class="flex flex-col gap-1 pt-2 absolute px-4 pb-4 mt-10 bg-white/50 backdrop-blur-md w-10/12 rounded-b-md shadow-md">
            {#each langs as lang (lang.id)}
                <ListboxOption class="py-1 ring-1 ring-zinc-200 rounded-md shadow-md px-4 bg-white hover:bg-zinc-100 transition-colors"
                               value={lang} disabled={lang.unavailable}>
                    {lang.name}
                </ListboxOption>
            {/each}
            </ListboxOptions>
        </Listbox>

        <button on:click={save} class="text-sky-400 ring-1 ring-sky-400 px-4 py-2 rounded-md shadow-md bg-white">
            {$t('common.save')}
        </button>
        
        {#if data.userId}
            <a class="block w-full" href="/{data.userId}">
                <button class="w-full text-rose-400 ring-1 ring-rose-400 px-4 py-2 rounded-md shadow-md bg-white">
                    {$t('common.go_back_to_my_gallery')}
                </button>
            </a>
        {:else}
            <a class="block w-full" href="/">
                <button class="w-full text-rose-400 ring-1 ring-rose-400 px-4 py-2 rounded-md shadow-md bg-white">
                    {$t('common.go_back_to_main')}
                </button>
            </a>
        {/if}
    </div>
	
</div>
