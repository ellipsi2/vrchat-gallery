<script lang="ts">
	import { onMount, tick } from 'svelte';
    import type { PageData } from './$types';
    import { includes, isEmpty, range } from "lodash-es";
    import HttpStatus from 'http-status-codes';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
    import dayjs from 'dayjs';
    import timezone from 'dayjs/plugin/timezone';
    import MdDeleteForever from 'svelte-icons/md/MdDeleteForever.svelte';
    import MdRetry from 'svelte-icons/md/MdRefresh.svelte';
    import MdSuccess from 'svelte-icons/md/MdCheck.svelte';
	import { fade } from 'svelte/transition';
	import { t } from '$lib/i18n';
	import { namesParser } from '$lib/gallery/image';
    import asyncPool from 'tiny-async-pool';

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
    let uploaded: number[] = [];
    let incompleted: IImageUploadResult[] = [];
    let retrying: number[] = [];


    interface IImageUploadResult {
                succeed: boolean;
                i: number;
                id: string;
            }

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
            let images = result.images;
            id = result.id;

            const uploader = (imageId: string, iterable: string[], retryCount: number = 0) => new Promise<IImageUploadResult>(async (resolve) => {
                const i = iterable.indexOf(imageId);
                const file = files.at(i);
                console.log(i);

                if (!file) {
                    return resolve({
                        succeed: false,
                        i,
                        id: imageId,
                    });
                }

                // console.log(file);
    
                const formData = new FormData();
                formData.set('file', file);
                console.log(file);
                console.log(formData.get('file'));

                //*
                const uploadRequest = await fetch(`https://img.vrc.vg/upload/${imageId}`, {
                    method: 'POST',
                    body: formData,
                });

                if (uploadRequest.ok !== true) {
                    console.log('retry');
                    if (retryCount >= 5) {
                        // return reject({ imageId, i });
                        console.log('retry count reached to 5. exhausted');
                        return resolve({
                            succeed: false,
                            i,
                            id: imageId,
                        });
                    }
                    
                    return await uploader(imageId, iterable, retryCount + 1);
                } // */

                // console.log(formData.get('file'));

                resolve({
                    succeed: true,
                    i,
                    id: imageId,
                });

            }) as Promise<IImageUploadResult>;

            for await (const result of asyncPool(4, images, uploader as any) as AsyncIterableIterator<IImageUploadResult>) {
                // uploaded.push(index);
                if (result.succeed) {
                    uploaded = [...uploaded, result.i];
                } else {
                    incompleted = [...incompleted, result];
                }
            }

        } finally {
            uploading = false;

            if (uploaded.length === fileList.length) {
                // all uploads are completed.
                publish();
            }
        }
    }

    function publish() {
        goto(`${data.id}/${id}`).then();
    }
    

    async function uploadRetry(i: number) {
        retrying = [...retrying, i];
        try {
            const target = incompleted.find(v => i === v.i);
            if (target) {
                const formData = new FormData;
                formData.set('file', files[i]);
            
                const uploadRequest = await fetch(`https://img.vrc.vg/upload/${target.id}`, {
                    method: 'POST',
                    body: formData,
                });
    
                if (uploadRequest.ok) {
                    incompleted = incompleted.filter(v => v.i !== i);
                    uploaded = [...uploaded, i];
                }
            }
        } finally {
            retrying = retrying.filter(v => v !== i);
        }
    }

</script>

<svelte:head>
    <title>Upload as {data.id} - vrc.vg</title>
</svelte:head>

{#if !isEmpty(retry)}
    <div class="fixed bg-gray-500/60 backdrop-blur-md inset-0 flex flex-row items-center z-50">
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
                    

                    {#if uploaded.includes(i)}
                    <div transition:fade class="absolute inset-0 bg-rose-300/25 backdrop-blur-md flex flex-row items-center">
                        <div class="flex flex-col items-center w-full text-white">
                            <p><MdSuccess /></p>
                        </div>
                    </div>
                    {:else if incompleted.find(v => v.i === i)}
                    <div transition:fade class="absolute inset-0 bg-zinc-400/50 backdrop-blur-md flex flex-row items-center">
                        <div class="flex flex-col items-center w-full">
                            <p>{$t('upload.failed')}</p>
                            <div>
                                <button disabled={retrying.includes(i)} on:click={() => uploadRetry(i)}
                                        class="bg-rose-400 disabled:bg-zinc-500 text-white rounded-md shadow-md px-4 py-2 w-8 box-content">
                                    <MdRetry />
                                </button>
                            </div>
                        </div>
                    </div>
                    {:else}
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
                    {/if}



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
            {#if !uploading && uploaded.length >= fileList.length}
            <button on:click={() => publish()} class="px-4 py-2 bg-rose-400 ring-1 ring-rose-300 text-white rounded-md disabled:bg-zinc-600 disabled:ring-zinc-400">
                {$t('upload.publish')}
            </button>
            {:else}
            <button disabled={uploading} on:click={() => upload()} class="px-4 py-2 bg-rose-400 ring-1 ring-rose-300 text-white rounded-md disabled:bg-zinc-600 disabled:ring-zinc-400">
                {#if uploading}
                    {$t('upload.uploading')}
                {:else}
                    {$t('upload.upload')}
                {/if}
            </button>
            {/if}
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