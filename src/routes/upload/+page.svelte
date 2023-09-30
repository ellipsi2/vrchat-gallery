<script lang="ts">
	import { onMount, tick } from 'svelte';
    import type { PageData } from './$types';
    import { isEmpty, range } from "lodash-es";
    import HttpStatus from 'http-status-codes';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
    import dayjs from 'dayjs';
    import timezone from 'dayjs/plugin/timezone';
    import MdDeleteForever from 'svelte-icons/md/MdDeleteForever.svelte'
	import { fade } from 'svelte/transition';
	import { t } from '$lib/i18n';
	import { namesParser } from '$lib/gallery/image';

    export let data: PageData;

    let file: HTMLInputElement;
    let files: File[] = [];
    let title = '';
    let description = '';
    let tags: string[] = [];
    let fileDragging = false;
    let retry: {imageId: string, i: number}[] = [];
    // let fileList: string[] = [];
    $: fileList = Array.from(files).map(file => URL.createObjectURL(file));

    let uploading = false;

    let id = '';


    class Queue<T> {
        private items: T[] = [];

        enqueue(item: T) {
            this.items.push(item);
        }

        dequeue() {
            return this.items.shift();
        }

        peek() {
            return this.items[0];
        }

        getSize() {
            return this.items.length;
        }

        isEmpty() {
            return this.getSize() === 0;
        }
    }


    const eventQueue = new Queue<Promise<void>>();

    onMount(() => {
        dayjs.extend(timezone);
    });

    function deleteSelectedFile(i: number) {
        files = [...files.slice(0, i), ...files.slice(i + 1, files.length)];
    }

    function fileSelected(event?: Event) {
        if (event?.target instanceof HTMLInputElement && event.target.files) {
            files = [...files, ...Array.from(event.target.files)];
        }

        // @ts-ignore
        const parsed = namesParser(files.map(v =>  v.name), dayjs.tz.guess()).map(v => v.getTime());

        const p = new Promise<void>((res) => {
            fetch('/api/image/conflict', {
                method: 'POST',
                body: JSON.stringify({
                    times: parsed,
                }),
            }).then(() => res());
        });

        eventQueue.enqueue(p);
        
        // fileList = Array.from(files).map(file => URL.createObjectURL(file));
        // progresses = range(0, files.length).map(() => 0);
    }

    function fileDrag(event: DragEvent) {
        // noinspection TypeScriptUnresolvedFunction
        if (event.dataTransfer?.types.includes('Files')) {
            fileDragging = true;
        }
    }

    function fileDragLeaveCheck(event: DragEvent) {
        fileDragging = false;
    }


    async function fileDrop(event: DragEvent) {
        await tick();
        fileDragging = false;
        if (event?.dataTransfer) {
    
            files = [...files, ...Array.from(event.dataTransfer.files)];
            fileSelected();
        }
    }

    function freeImageURL(img: HTMLImageElement) {
        setInterval(() => {
            if (img.complete) {
                URL.revokeObjectURL(img.src);
            }
        }, 16);
    }

    async function upload(isRetry = false) {
        uploading = true;

        try {
            let images: string[];
            // let test = false;

            // console.log(isRetry);
            
            if (!isRetry) {
                // console.log('first attempt');
                const res = await fetch(`/api/upload?count=${files.length}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        names: Array.from(files).map((v: File) => v.name),
                        // @ts-ignore
                        timezone: (<any>dayjs).tz.guess(),
                        title,
                        description,
                        tags,
                    }),
                });

                const result = await res.json() as {images: string[], id: string};
                images = result.images;
                id = result.id;
            } else {
                images = retry.map(v => v.imageId);
                // test = true;
            }
            // return;

            const allReady = images.map((imageId, i) => new Promise<void>((res, rej) => {
                /*
                if (!test) {
                    return rej({imageId, i});
                } */


                let n = i;
                if (isRetry) {
                    n = retry.find(v => v.imageId === imageId)!.i;
                }

                const xhr = new XMLHttpRequest;
                const formData = new FormData;
                formData.set('file', files[n]);

                xhr.open('POST', `https://img.now.gd/upload/${imageId}`, true);

                xhr.onload = function() {
                    if (xhr.status != HttpStatus.OK) {
                        console.error('xhr error');
                    } else { // show the result
                        console.log('xhr done');
                        res();
                    }
                };

                xhr.onerror = function() {
                    console.log('xhr error!')
                    rej({ imageId, i: n });
                };

                xhr.send(formData);
            }));

            // console.log(allReady);

            const p = await Promise.allSettled(allReady);

            const _retry = p.filter(v => v.status === 'rejected')
                .map(v => (<any>v).reason);
            console.log(allReady, images, p);
            if (!isEmpty(_retry)) {
                retry = _retry;
                // console.log('retry!');
            } else {
                // console.log('done!');
                goto(`/${data.id}/${id}`).then();
            }
            /*
            
            if (!isEmpty(_retry)) {
                retry = _retry;
            } else {
            } // */
        } finally {
            if (retry.length <= 0) {
                uploading = false;
            }

        }
    }

</script>

<svelte:head>
    <title>Upload as {data.id} - vrc.now.gd</title>
</svelte:head>

{#if !isEmpty(retry)}
    <div class="fixed bg-gray-500/60 backdrop-blur-md inset-0 flex flex-row items-center">
        <div class="flex flex-col items-center w-full">
            <div class="w-1/2 bg-zinc-100 p-4 rounded-md flex flex-col gap-2">
                <p>{$t('upload.retry_message')}</p>
                <div class="w-full flex flex-col gap-2">
                    <button disabled={uploading} on:click={() => upload(true)} class="px-4 py-2 bg-rose-400 ring-1 ring-rose-300 text-white rounded-md disabled:bg-zinc-600 disabled:ring-zinc-400 w-full">
                        {#if uploading}
                            {$t('upload.uploading')}
                        {:else}
                            {$t('upload.upload')}
                        {/if}
                    </button>
                    <button disabled={uploading} on:click={() => goto(`/${data.id}/${id}`).then()} class="px-4 py-2 bg-rose-200 ring-1 ring-rose-100 text-rose-500 rounded-md disabled:bg-zinc-600 disabled:ring-zinc-400 w-full">
                        {#if uploading}
                            {$t('upload.uploading_skip')}
                        {:else}
                            {$t('upload.upload_skip')}
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<div class="w-4/6 sm:w-2/3 md:w-1/2 lg:w-1/3 mx-auto space-y-4 p-4">
        <div class="hidden"><input type="file" multiple accept=".png, .jpg, .gif, .webp"
            bind:this={file} on:change={fileSelected} /></div>
    
        <button class="w-full py-8 rounded-md shadow-md bg-zinc-100"
                on:dragover|preventDefault={fileDrag}
                on:dragleave|preventDefault={fileDragLeaveCheck}
                on:drop|preventDefault={fileDrop}
                on:click={() => {file.click();}}>
            {$t('upload.upload_button')}
        </button>

    <div class:hidden={fileList.length <= 0}>
        <div class="flex flex-col gap-2 pb-4">
            {#each fileList as src, i}
                <div class="relative rounded-md overflow-hidden ring-1 ring-rose-400">
                    <div class="absolute top-2 left-2">
                        <p class="px-2 py-1 text-sm w-3/4 text-zinc-700 bg-white/50 ring-1 ring-zinc-200 backdrop-blur-sm rounded-md">{files[i].name}</p>
                    </div>
                    <div class="absolute top-2 right-2">
                        <button on:click={() => deleteSelectedFile(i)}
                                class="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md box-content flex flex-row items-center transition-colors">
                            <span class="inline-block w-4">
                                <MdDeleteForever />
                            </span>
                        </button>
                    </div>
                    <img class="object-cover w-full h-full" {src} alt="" use:freeImageURL />
                </div>
            {/each}
        </div>
        <div class="flex flex-col gap-2 pb-20">
            <div class="ring-1 ring-rose-400 rounded-md px-4 py-2">
                <input bind:value={title} class="w-full outline-none" type="text" placeholder="Title">
            </div>
            <div class="ring-1 ring-rose-400 rounded-md px-4 py-2">
                <textarea bind:value={description} class="w-full outline-none resize-y" placeholder="Description"></textarea>
            </div>
            <div class="text-xs">
                <div class="flex flex-col gap-2">
                    <h3>{$t('common.tags')} ({tags.length}/10)</h3>
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
            <div class="text-xs text-">{$t('upload.upload_notice_warn2')}</div>
            <button disabled={uploading} on:click={() => upload()} class="px-4 py-2 bg-rose-400 ring-1 ring-rose-300 text-white rounded-md disabled:bg-zinc-600 disabled:ring-zinc-400">
                {#if uploading}
                    {$t('upload.uploading')}
                {:else}
                    {$t('upload.upload')}
                {/if}
            </button>
        </div>
    </div>
    <div class:hidden={fileList.length > 0}  class="text-xs text-red-500">
        <p>{$t('upload.notice_limitation1')}</p>
        <p>{$t('upload.notice_limitation2')}</p>
        <p>{$t('upload.notice_limitation3')}</p>
        <p>{@html $t('upload.notice_limitation4')}</p>
        <div>
            <strong>
                {$t('upload.upload_notice')}:
            </strong>

            <ol class="list-decimal">
                <li>{$t('upload.upload_notice_element1')}</li>
                <li>{$t('upload.upload_notice_element2')}</li>
            </ol>

            <p>{$t('upload.upload_notice_warn')}</p>
        </div>
    </div>
</div>