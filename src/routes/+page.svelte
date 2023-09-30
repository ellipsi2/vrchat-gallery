<script lang="ts">
	import { t } from '$lib/i18n/index';
    export let data;
</script>
<svelte:head>
    <title>now.gd</title>
</svelte:head>
<div class="hidden">Hi! I'm hidden element!</div>
<div class="p-4 flex flex-col gap-4">
    <div>
        <p>
            {$t('common.warn1')}
        </p>
        <p>
            {$t('common.warn2')}
        </p>
        <p>
            {$t('common.notice1')}
        </p>
    </div>
    
    <p>0.1.1</p>
    
    <div class="w-full flex flex-col gap-2 items-center">
        {#if data.id}
        <a href="/{data.id}">
            <button class="px-4 py-2 bg-rose-400 text-white rounded-md shadow-md">
                {$t('common.goto_gallery')}
            </button>
        </a>
        {:else}
        <p>{$t('common.you_have_account?')}</p>
        <a href="/login">
            <button class="px-4 py-2 bg-rose-400 text-white rounded-md shadow-md">
                {$t('common.login')}
            </button>
        </a>
        {/if}
        <a href="/settings">
            <button class="px-4 py-2 text-rose-400 bg-white ring-1 ring-rose-400 rounded-md shadow-md">
                {$t('common.settings')}
            </button>
        </a>
    </div>
</div>