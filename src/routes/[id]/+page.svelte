<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type { PageData } from './$types';
    import { page } from '$app/stores';
    import MdAdd from 'svelte-icons/md/MdAdd.svelte';
    import MdPhoto from 'svelte-icons/md/MdPhoto.svelte';
    import dayjs from 'dayjs';
	import { locale, t } from '$lib/i18n';
	import { fade } from 'svelte/transition';
    import type {Dayjs} from 'dayjs';
	import { last } from 'lodash-es';

    export let data: PageData;

    let loaded = false;
    let openUserList = false;
    let isHitBottom = false;
    let appending = false;
    // @ts-ignore
    declare var allImages: typeof data.images;
    $: allImages = [...data.images];
    $: counts = data.counts;

    onMount(async () => {
        loaded = true;
        console.log('loaded', allImages.length)

        console.log(data);
    });

    function isSameDay(a: Dayjs, b: Dayjs) {
        return a.format('L') === b.format('L');
    }

    function isSameDates(dates: number[]) {
        const e = dayjs(dates[0]);
        const l = dayjs(dates[1]);
        return isSameDay(e, l);
    }

    function isSameTime(a: Dayjs, b: Dayjs) {
        return a.format('LTS') === b.format('LTS');
    }

    function isSameTimes(dates: number[]) {
        const e = dayjs(dates[0]);
        const l = dayjs(dates[1]);
        return isSameTime(e, l);
    }

    function checkCloseUserList(event: MouseEvent) {
        function isPartOfUserMenu(element: HTMLElement | null) {
            if (element) {
                const contains = element.classList.value.includes('__user-list');
                if (contains) {
                    return true;
                } else {
                    return isPartOfUserMenu(element.parentElement);
                }
            }
            return false;
        }

        if (event.target instanceof HTMLElement) {
            if (isPartOfUserMenu(event.target)) {
                if (event.target.classList.value.includes('__user-list-button')) {
                    openUserList = !openUserList;
                } else {
                    openUserList = true;
                }
            } else {
                openUserList = false;
            }
        }
    }

    onMount(() => {
        
        document.addEventListener('click', checkCloseUserList);

        return () => {
            document.removeEventListener('click', checkCloseUserList);
        }
    });



	function infiniteLoad(element: HTMLDivElement): any {
        let observer = new IntersectionObserver(async function (e) {
            if (counts.max <= allImages.length) {
                return;
            }

            if (e.length <= 0 && appending) {
                return;
            }

            const {intersectionRect: ir, boundingClientRect: br} = e[0];

            if (ir.y === br.y) {
                try {
                    console.log('appending');
                    isHitBottom = true;
                    appending = true;

                    const olderImage: any = last(allImages);

                    if (!olderImage) return;

                    const r = await fetch(`/api/image/${$page.params.id}?last=${olderImage._key}`);
                    const {images: i, counts: c} = await r.json();

                    allImages = [...allImages, ...i,];

                    counts.max = c.max;
                    counts.prev = c.prev;
                } finally {
                    isHitBottom = false;
                    appending = false;
                }
            }
        }, {
            // root: element,
            rootMargin: '0px',
            threshold: 1.0,
        });
        observer.observe(element);
        onDestroy(() => {
            observer.unobserve(element);
        });
	}
</script>

<svelte:head>
    <title>{data.name} - vrc.now.gd</title>
</svelte:head>

<nav
    class="sticky flex flex-row justify-between top-0 w-full p-4 bg-slate-100/25 backdrop-blur-md z-10 ring-1 ring-zinc-200 shadow-md"
>
    <span class="relative __user-list">
        <button class="bg-rose-400 px-4 py-2 rounded-md text-white shadow-md __user-list-button">
            {#if !openUserList}
                {data.name}
            {:else}
                {$t('common.close_user_list')}
            {/if}
        </button>
        {#if openUserList}
            <div
                class="absolute bg-zinc-200/50 backdrop-blur-md w-full sm:w-[16rem] md:w-[20rem] mt-2 rounded-md p-2 z-20 shadow-md"
            >
                <ol class="flex flex-col gap-1">
                    {#each data.users as user}
                        <li>
                            <a href="/{user.id}">
                                <button
                                    disabled={user.id === $page.params.id}
                                    class="bg-zinc-100/75 disabled:bg-zinc-400/75 disabled:text-zinc-50 backdrop-blur-md rounded-md px-4 py-2 w-full shadow-md transition-colors"
                                >
                                    {user.name}
                                </button>
                            </a>
                        </li>
                    {/each}
                </ol>
            </div>
        {/if}
    </span>

    {#if data.manage}
        <a href="/upload">
            <button class="bg-rose-400 p-2 text-white shadow-md rounded-full w-10 h-10 text-md">
                <MdAdd />
            </button>
        </a>
    {/if}
</nav>

<div class="p-4">
    {#if loaded}
    <div transition:fade class="flex flex-row flex-wrap gap-4">
        {#each allImages as image (image.id)}
        <div class="__gallery-box">
            <a href="{$page.url.pathname}/{image.id}">
                <button style="width: calc(100% - 0.5rem)"
                    class="relative m-1 p-1 rounded-md overflow-hidden ring-1 ring-rose-200 hover:ring-rose-400 transition-all"
                >
                    <span
                        class="absolute top-2 right-2 flex flex-row items-center bg-zinc-200/50 backdrop-blur-sm rounded-md px-2 py-0.5 gap-1"
                    >
                        <span class="w-4"><MdPhoto /></span>
                        <span class="text-sm -mt-0.5">{image.length}</span>
                    </span>
                    <img
                        loading="lazy"
                        class="rounded-md h-auto aspect-square"
                        src="https://img.now.gd/{image.preview}/thumb"
                        alt=""
                    />
                    <div class="px-4 py-2 text-left">
                        <h2>
                            {#if image.title.length > 0}
                                {image.title}
                            {:else}
                                {$t('common.untitled')}
                            {/if}
                        </h2>
                        <p class="text-xs block text-zinc-600">
                            {#if Array.isArray(image.dates) && image.dates.filter((v) => !!v).length > 0}
                                <div class="flex flex-col sm:flex-row gap-1">
                                    <time class="inline sm:hidden text-zinc-800" datetime="{(new Date(image.dates[0])).toISOString()}">
                                        {dayjs(image.dates[0]).format('LL')}
                                    </time>
                                    <span>
                                    <time datetime="{(new Date(image.dates[0])).toISOString()}">
                                        <span class="hidden sm:inline text-zinc-800">
                                            {dayjs(image.dates[0]).format('LL')}
                                        </span>
                                        {#if isSameDates(image.dates)}
                                            {dayjs(image.dates[0]).format('LTS')}
                                        {/if}
                                    </time>
                                    {#if image.dates.filter((v) => !!v).length > 1}
                                        <span>~</span>
                                        <time datetime="{(new Date(image.dates[1])).toISOString()}}">
                                            {#if isSameDates(image.dates)}
                                                {dayjs(image.dates[1]).format('LTS')}
                                            {:else}
                                                <span class="text-zinc-800">
                                                    {dayjs(image.dates[1]).format('LL')}
                                                </span>
                                            {/if}
                                        </time>
                                    
                                    {/if}
                                    </span>
                                </div>
                            {:else}
                                No dates
                            {/if}
                        </p>
                        <div class="text-xs mt-1">
                            <button class="bg-rose-300 rounded-md px-1 py-0.5 text-white">
                                tag placehoder
                            </button>
                        </div>
                    </div>
                </button>
            </a>
        </div>
        {/each}

        {#if isHitBottom}
            <div class="w-full h-24 fixed bottom-0">Loading</div>
        {/if}
        
        <div use:infiniteLoad></div>
    </div>
    {:else}
    <p class="w-full text-lg">
        {$t('common.loading')}
    </p>
    {/if}
</div>

<style>
    .__gallery-box {
        width: calc(50% - 0.5rem);
    }

    @media (min-width: 768px) {
        .__gallery-box {
            width: calc(33.3333% - 0.667rem);
        }
    }

    @media (min-width: 1536px) {
        .__gallery-box {
            width: calc(20% - 0.8rem);
        }
    }
</style>
