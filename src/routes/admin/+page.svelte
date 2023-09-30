<script lang="ts">
    import type { ActionData, PageData } from './$types';
    import {invalidateAll} from '$app/navigation';
    import { applyAction, deserialize } from '$app/forms';
    import {page} from '$app/stores';
    
    export let data: PageData;
    export let form: ActionData;

    let savedUid = '';
    let uid = '';
    let checked = false;
    let created = false;

    async function requestJoin() {
        const b = checked || (savedUid && uid === savedUid);
        if (!b) {
            const body = new FormData;

            body.set('uid', uid);
            body.set('check', '1');

            const res = await fetch($page.url.pathname, {
                method: 'POST',
                body
            });

            const result = deserialize(await res.text());
           
            if (result.type === 'success') {
            // rerun all `load` functions, following the successful update
                await invalidateAll();
            }

            applyAction(result);

            checked = !!form && Object.hasOwn(form, 'displayName');
            savedUid = uid;
        } else {
            if (savedUid !== uid) {
                checked = false;
                return requestJoin();
            }

            const body = new FormData;

            body.set('uid', uid);
            
            const n = form!.displayName!.toString();
            body.set('displayName', n);

            const res = await fetch($page.url.pathname, {
                method: 'POST',
                body
            });

            const result = deserialize(await res.text());
           
            if (result.type === 'success') {
            // rerun all `load` functions, following the successful update
                await invalidateAll();
            }

            applyAction(result);

        }
    }

    function copyCode() {
        if (form?.token) {
            window.navigator.clipboard.writeText(form.token);
        }
    }

</script>

<svelte:head>
    <title>관리자 전용 페이지</title>
</svelte:head>

<div class="h-dyn-screen flex flex-row items-center">
    {#if form?.token}
        <div class="p-4 flex flex-col gap-2 w-10/12 sm:w-4/6 md:w-1/2 lg:w-1/3 mx-auto">
            <textarea class="text-xs w-full h-32 resize-none outline-none p-2 ring-1 ring-rose-200 rounded-md" disabled>{form.token}</textarea>
            <button on:click={copyCode} class="py-2 rounded-md ring-1 ring-rose-300 bg-rose-200 text-white hover:bg-rose-400 transition-colors">복사</button>
            <button on:click={() => form = null} class="py-2 rounded-md ring-1 ring-red-500 bg-red-400 text-white hover:bg-red-600 transition-colors">새 토큰 생성</button>
        </div>
    {:else}
        <form method="POST" class="p-4 flex flex-col gap-2 w-10/12 sm:w-4/6 md:w-1/2 lg:w-1/3 mx-auto">
            <div class="ring-1 ring-rose-200 rounded-md px-4 py-2">
                <input bind:value={uid} name="uid" type="text" class="bg-transparent outline-none w-full caret-gray-500 placeholder:p-0.5" placeholder="VRC UID" />
            </div>

            <button on:click|preventDefault={requestJoin} class="w-full py-2 bg-rose-200 text-white rounded-md hover:bg-rose-400 transition-colors">
                {checked || (savedUid && uid === savedUid) ? `${form?.displayName} 계정 생성` : '계정 확인'}
            </button>
        </form>
    {/if}
</div>