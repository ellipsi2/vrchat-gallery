<script lang="ts">
	import { onMount } from 'svelte';
    import '../styles/tailwind.css';
	import { t } from '$lib/i18n';
	import { isEmpty } from 'lodash-es';
	import { page } from '$app/stores';

    export let data;
    let showTranslationReport = false;
    let selectedElement: HTMLElement | undefined;
    $: textContent = selectedElement?.textContent ?? '';
    let reportText = '';
    let manualMode = false;
    let manualText = '';
    let reportError = false;
    let reporting = false;

    onMount(() => {
        document.addEventListener('click', (event) => {
            const ev = event as PointerEvent;
            // console.log(`alt: ${ev.altKey}, shift: ${ev.shiftKey}`);
            if (ev.shiftKey && ev.altKey) {
                ev.preventDefault();
                

                if (data.user) {
                    if (selectedElement == ev.target) {
                        // console.log(selectedElement);
                        showTranslationReport = true;
                    } else if (ev.target instanceof HTMLElement) {
                        selectedElement = ev.target;
                    }
                }
            }
        });
    });

    function getElementPath(element: HTMLElement): string[] {
        const path: string[] = [];
        let currentNode: HTMLElement | null = element;

        while (currentNode !== null) {
            if (currentNode === document.body) {
                path.unshift('body');
            } else {
                const nodeName = currentNode.nodeName.toLowerCase();
                const id = currentNode.id ? `#${currentNode.id}` : '';
                const classNames = currentNode.className
                    ? `.${currentNode.className.replace(/\s+/g, '.')}`
                    : '';
                path.unshift(`${nodeName}${id}${classNames}`);
            }

            currentNode = currentNode.parentElement;
        }

        return path;
    }

    async function report() {
        if (!reporting) {
            reporting = true;
        } else {
            return;
        }

        try {
            if (!selectedElement) {
                reportError = true;
                return;
            }
            const path = getElementPath(selectedElement);
            await fetch('/api/report/translation', {
                method: 'PUT',
                body: JSON.stringify({
                    current: isEmpty(manualText) ? textContent : manualText,
                    correct: reportText,
                    path,
                    pathname: $page.url.pathname,
                }),
            });
            showTranslationReport = false;
        } catch {
            reportError = true;
            setTimeout(() => {
                showTranslationReport = false;
            }, 2000);
        } finally {
            reporting = false;
        }
    }

    function closeTransloationReport() {
        selectedElement = undefined;
        reportText = '';
        showTranslationReport = false;
    }
</script>

{#if showTranslationReport}
<div class="absolute inset-0 p-8 bg-black/50 z-50 backdrop-blur-sm text-white">
    <h1 class="text-lg mb-2">{$t('report.translation_report')}</h1>
    {#if !manualMode}
        <p>
            {$t('report.you_selected', {value: textContent})}
        </p>
        <p class="mb-2">
            <button on:click={() => manualMode = true} class="text-sky-400">
                {$t('report.click_here_enter_manually')}
            </button>
        </p>
    {:else}
        <div>
            <div class="w-full bg-zinc-50 px-4 py-2 rounded-md shadow-md text-black mb-4">
                <input class="bg-transparent w-full outline-none" type="text" bind:value={manualText}
                    placeholder="{textContent}" />
            </div>
        </div>
    {/if}
    <div class="w-full bg-zinc-50 px-4 py-2 rounded-md shadow-md text-black mb-4">
        <input class="bg-transparent w-full outline-none" type="text" bind:value={reportText}
               placeholder="{$t('report.input_placeholder')}" />
    </div>
    <div class="flex flex-col gap-2">
        <button on:click={report} class="bg-sky-400 rounded-md shadow-md px-4 py-2 disabled:bg-zinc-400" disabled={reportError}>
            {#if !reportError}
                {$t('common.submit')}
            {:else}
                ERROR!!
            {/if}
        </button>
        
        <button class="bg-red-600 rounded-md shadow-md px-4 py-2" on:click={closeTransloationReport}>{$t('common.close')}</button>
    </div>
</div>
{/if}

<slot />