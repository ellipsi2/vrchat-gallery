<script lang="ts">
	import { includes, uniq } from 'lodash-es';
    import type { PageData } from './$types';
    import {onMount} from 'svelte';
	import { page } from '$app/stores';
    import MdUp from 'svelte-icons/md/MdArrowUpward.svelte';
    import MdDown from 'svelte-icons/md/MdArrowDownward.svelte';
	import dayjs from 'dayjs';
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
    
    export let data: PageData;
    let failures: number[] = [];
    let markedForDelete: string[] = [];

    let title = data.parent.title;
    let description = data.parent.description;
    let tags = Array.isArray(data.parent.tags) ? [...data.parent.tags] : [];

    let sending = false;

    onMount(async () => {
        let i = 0;
        for (const image of data.parent.images) {
            const res = await fetch(`https://img.vrc.vg/${image}/xs`);
            if (res.status === 404) {
                failures = [...failures, i];
            }
            i++;
        }
    });

    async function changeFile(i: number) {
        const target = data.parent.images[i];
        console.log(target);
    }

    function markForDelete(id: string) {
        if (markedForDelete.includes(id)) {
            markedForDelete = markedForDelete.filter(image => image !== id);
        } else {
            markedForDelete = uniq([...markedForDelete, id]);            
        }
    }

    function equalsIgnoreOrder<T>(a: T[], b: T[]){
        if (a.length !== b.length) return false;
        const uniqueValues = new Set([...a, ...b]);
        for (const v of uniqueValues) {
            const aCount = a.filter(e => e === v).length;
            const bCount = b.filter(e => e === v).length;
            if (aCount !== bCount) return false;
        }
        return true;
    }

    async function save() {
        try {
            sending = true;

            const saveData: Record<string, any> = {
                id: $page.params.image,
            };

            if (data.parent.title !== title.trim()) {
                saveData.title = title.trim();
            }

            if (data.parent.description !== description.trim()) {
                saveData.description = description.trim();
            }

            const cleanTags = tags
                .filter(v => typeof v === 'string')
                .map(v => v.trim())
                .filter(v => v.length > 0);
            if (!equalsIgnoreOrder(data.parent.tags, cleanTags)) {
                saveData.tags = cleanTags;
            }

            await fetch(`/api/image`, {
                method: 'POST',
                body: JSON.stringify(saveData)
            });

            await goto('.', {
                invalidateAll: true,
            });
        } finally {
            sending = false;
        }
    }
    
</script>

<svelte:head>
    <title>
        {$page.params.id} - vrc.vg
    </title>
</svelte:head>

<div class="h-dyn-screen flex flex-row items-center">
    <div class="p-4 flex flex-col gap-2 w-11/12 sm:w-4/6 md:w-1/2 lg:w-1/3 mx-auto ring-1 ring-zinc-200 bg-zinc-50 rounded-md">
        <div class="flex flex-col gap-2 items-center overflow-y-scroll" style="height: 85dvh;">
            
            <div class="w-full px-4 pt-2 pb-4 flex flex-col gap-2">
                <div class="ring-1 ring-rose-400 rounded-md px-4 py-2 bg-white">
                    <input bind:value={title} class="w-full outline-none bg-transparent" type="text" placeholder="{$t('common.untitled')}">
                </div>

                <div class="ring-1 ring-rose-400 rounded-md px-4 py-2 bg-white">
                    <textarea bind:value={description} class="w-full outline-none resize-y  bg-transparent" placeholder="Description Empty"></textarea>
                </div>
                
                <div class="text-xs">
                    <div class="flex flex-col gap-2">
                        <h3>Tags ({tags.length}/10)</h3>
                        <div>
                            {#each tags as tag}
                                <span>{tag}</span>
                            {/each}
                        </div>
                    </div>
                    <div class="w-full bg-zinc-100 rounded-md px-2 py-1">
                        <input type="text" class="w-full outline-none bg-transparent" />
                    </div>
                </div>
            </div>

            <ol class="w-full px-8">
                {#each data.parent.images as image, i}
                    <li class="flex flex-row gap-2">
                        <div>
                            <div class="relative rounded-md ring-1 ring-zinc-300 overflow-hidden w-56 h-56">
                                <img class:grayscale={markedForDelete.includes(image)}
                                     class="filter transition-all"
                                     src="https://img.vrc.vg/{image}/xs" alt="" />
    
                                {#if failures.includes(i)}
                                    <div class="absolute inset-0">
                                        <div class="w-full h-full flex flex-row items-center">
                                            <div class="w-full flex flex-col items-center">
                                                <button on:click={() => changeFile(i)}
                                                        class="bg-rose-400 text-white px-4 py-2 rounded-md shadow-md inline-block">
                                                    {$t('manage.change_as_new_file')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <div class="flex flex-col justify-between py-4 w-full">
                            <button class:bg-red-600={!markedForDelete.includes(image)}
                                    class:text-white={!markedForDelete.includes(image)}
                                    class:bg-white={markedForDelete.includes(image)}
                                    class:text-red-600={markedForDelete.includes(image)}
                                    class="relative w-full p-2 rounded-md shadow-md text-sm ring-1 ring-red-600 transition-colors"
                                    on:click={() => markForDelete(image)}>
                                {#if !markedForDelete.includes(image)}
                                    <span>{$t('manage.mark_as_delete')}</span>
                                {:else}
                                    <span>{$t('manage.unmark_delete')}</span>
                                {/if}
                            </button>
                            

                            <div>
                                {#if data.parent.dates && typeof data.parent.dates[i] === 'number'}
                                    <time class="block text-center text-sm text-zinc-800" datetime="{(new Date(data.parent.dates[i])).toISOString()}">
                                        {dayjs(data.parent.dates[i]).format('LLLL')}
                                    </time>
                                {/if}
                                <button class="w-full px-4 py-2 bg-orange-400 rounded-md shadow-md text-white text-sm">
                                    {$t('manage.load_file_to_change_date')}
                                </button>
                            </div>

                            <div class="flex flex-row justify-between">

                                <button class="px-4 py-2 bg-rose-400 rounded-md shadow-md text-white text-sm flex flex-row items-center">
                                    <span class="w-8">
                                        <MdUp />
                                    </span>
                                </button>


                                <button class="px-4 py-2 bg-rose-400 rounded-md shadow-md text-white text-sm flex flex-row items-center">
                                    <span class="w-8">
                                        <MdDown />
                                    </span>
                                </button>
                            </div>
                        </div>
                    </li>
                {/each}
            </ol>
            <div class="w-full p-2">
                <button class="w-full bg-red-600 hover:bg-red-500 text-white rounded-md shadow-md px-4 py-2 transition-colors">
                    {$t('common.delete_all')} (NOT WORKING CURRENTLY)
                </button>
            </div>
        </div>
        <div class="flex flex-col gap-2">
            <button on:click="{save}" 
                    class="bg-rose-400 text-white px-4 py-2 w-full rounded-md shadow-md hover:bg-rose-500 transition-colors">
                {$t('common.save')}
            </button>
            <a href=".">
                <button class="bg-white text-rose-400 px-4 py-2 w-full rounded-md shadow-md ring-1 ring-rose-400 hover:ring-rose-500 hover:text-rose-500 transition-colors">
                    {$t('common.back')}
                </button>
            </a>
        </div>
    </div>
</div>