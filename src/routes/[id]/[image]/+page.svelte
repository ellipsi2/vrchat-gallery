<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
    import type { PageData } from './$types';
    import Zoom from 'svelte-zoom';
    import {onMount} from 'svelte';

    import MdContentCopy from 'svelte-icons/md/MdContentCopy.svelte'
    import MdEdit from 'svelte-icons/md/MdEdit.svelte'

    // import Swiper JS
    import Swiper from 'swiper';
    import { Navigation, Pagination, Keyboard } from 'swiper/modules';
    // import Swiper styles
    import 'swiper/css';
    import 'swiper/css/navigation';
    import 'swiper/css/pagination';
	import { range } from 'lodash-es';
	import { t } from '$lib/i18n';

    export let data: PageData;
    let viewHD = false;
    let viewDetail = false;
    let swiper: Swiper;

    let current = 1;
    $: max = data.images.length;
    let loaded = range(0, max).map(() => false);

    function prev() {
        current = Math.max(current - 1, 1);
    }

    function next() {
        current = Math.min(current + 1, max);
    }

    function exit() {
        if (viewHD) {
            viewHD = false;
            swiper.isLocked = false;
        } else {
            goto(`/${$page.params.id}`)
        }
    }

    function enterZoomMode() {
        swiper.isLocked = true;
        viewHD = true;
    }

    function copyImageDirectUrl() {
        window.navigator.clipboard.writeText(`https://img.vrc.vg/${data.images[swiper.activeIndex]}/public`);
    }

    onMount(() => {
        document.body.style.backgroundColor='black';

        swiper = new Swiper('.swiper', {
            // configure Swiper to use modules
            modules: [Navigation, Pagination, Keyboard],
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            keyboard: true,
        });

        swiper.on('slideChange', function () {
            current = swiper.activeIndex + 1;
            const img: HTMLImageElement | null = document.body.querySelector(`#img-${current}`);
            if (img instanceof HTMLImageElement && !loaded[current]) {
                img.src = `https://img.vrc.vg/${data.images[swiper.activeIndex]}/public`;
                loaded[current] = true;
            }
        });

        const firstImage = document.body.querySelector('#img-1');

        if (firstImage instanceof HTMLImageElement) {
            firstImage.src = `https://img.vrc.vg/${data.images[0]}/public`;
            loaded[0] = true;
        }


        return () => {
            swiper.detachEvents();
            document.body.style.backgroundColor='';
        }
    });

</script>

<svelte:head>
    <title>Image detail - vrc.vg</title>
</svelte:head>

<div class="h-dyn-screen bg-black relative overflow-y-hidden">
    <nav class="p-4 bg-zinc-900 ring-1 ring-zinc-700 text-white flex flex-row justify-between sticky z-20">
        <div class="flex flex-row divide-x divide-zinc-700">
            <button class="px-2" on:click={exit}>
                {#if viewHD}
                    {$t('common.disable_zoom')}
                {:else}
                    {$t('common.back')}
                {/if}
            </button>
            <button on:click={() => viewDetail = !viewDetail} class="px-2">
                {#if viewDetail}
                    {$t('common.close')}
                {:else}
                    {$t('common.view_detail')}
                {/if}
            </button>
        </div>
        <div class="flex flex-row items-center gap-2">
            {#if data.isOwner}
                <a href="{$page.url.pathname}/manage">
                    <button class="flex flex-row items-center gap-0.5 text-sky-400 hover:text-rose-200 transition-colors">
                        <span class="w-4">
                            <MdEdit />
                        </span>
                        <span>{$t('common.edit')}</span>
                    </button>
                </a>
            {/if}
            <button on:click={copyImageDirectUrl}
                    class="flex flex-row items-center gap-0.5 text-rose-400 hover:text-rose-200 transition-colors">
                <span class="w-4">
                    <MdContentCopy />
                </span>
                <span>
                    {$t('common.copy_direct_link')}
                </span>
            </button>
            <span>
                {current} / {max}
            </span>
        </div>
    </nav>

    {#if viewHD}
    <div class="absolute top-16 inset-0 z-10 bg-black">
        <Zoom src="https://img.vrc.vg/{data.images[swiper.activeIndex]}/hd" alt="" />
    </div>
    {/if}

    {#if viewDetail}
        <div class="absolute z-20 top-16 left-8 p-4 text-white max-w-96 bg-black/50 backdrop-blur-md rounded-md shadow-md">
            <div>
                <p>
                    {$t('common.title')}:
                    {#if data.title.length > 0}
                        {data.title}
                    {:else}
                    {$t('common.untitled')}
                    {/if}
                </p>
                {#if data.description.length > 0}
                    <p class="w-96 break-words">
                        {$t('common.description')}:
                        {data.description}
                    </p>    
                {/if}
                {#if data.tags.length > 0}
                    <p>{$t('common.tags')}:</p>
                {/if}
            </div>
        </div>
    {/if}


    <div class="text-white absolute top-16 inset-0">
        <!-- Slider main container -->
        <div class="swiper w-full h-full">
            <!-- Additional required wrapper -->
            <div class="swiper-wrapper">
            <!-- Slides -->

                {#each data.images as image, i}
                    <div class="swiper-slide">

                        <div class="flex flex-row items-center w-full h-full">
                            <div class="flex flex-col items-center w-full">
                                <button class="max-h-full" on:click={enterZoomMode}>
                                    <img id="img-{i + 1}" src="" alt="" />
                                </button>
                            </div>
                        </div>

                    </div>
                {/each}
                
            </div>
            <!-- If we need pagination -->
            <div class="swiper-pagination"></div>
        
            <!-- If we need navigation buttons -->
            <div class="swiper-button-prev p-10"></div>
            <div class="swiper-button-next p-10"></div>
        
            <!-- If we need scrollbar -->
            <div class="swiper-scrollbar"></div>
        </div>
    </div>

    
</div>