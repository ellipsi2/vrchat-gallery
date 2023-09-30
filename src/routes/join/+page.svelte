<script lang="ts">
	import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    
    export let data: PageData;

    let id = '';
    let pw = '';
    let pwc = '';
    let token = '';

    let displayName: string | undefined;

    async function requestJoin() {
        const res = await fetch('/api/auth', {
            method: 'PUT',
            body: JSON.stringify({
                id,
                pw,
                token,
            }),
        });

        const {redir} = await res.json();

        goto(redir);
    }

    function parseDisplayName() {
        if (token.length > 0 && token.split('.').length === 3) {
            try {
                const body = JSON.parse(atob(token.split('.')[1]));

                displayName = body.displayName;

            } catch {
                displayName = undefined;
            }
        } else {
            displayName = undefined;
        }
    }

</script>

<svelte:head>
    <title>Join - vrc.now.gd</title>
</svelte:head>

<div class="h-dyn-screen flex flex-row items-center">
    <div class="p-4 flex flex-col gap-2 w-10/12 sm:w-4/6 md:w-1/2 lg:w-1/3 mx-auto">


        <div class="ring-1 ring-rose-200 rounded-md p px-4 py-2">
            <input bind:value={id} type="text" class="bg-transparent outline-none w-full caret-gray-500 placeholder:p-0.5" placeholder="ID" />
        </div>

        <div class="ring-1 ring-rose-200 rounded-md p px-4 py-2 divide-y space-y-1">
            <input bind:value={pw} type="password" class="bg-transparent outline-none w-full caret-gray-500 placeholder:p-0.5" placeholder="Password" />
            <input bind:value={pwc} type="password" class="bg-transparent outline-none w-full caret-gray-500 placeholder:p-0.5 pt-1" placeholder="Re type your Password" />
        </div>

        <div class="ring-1 ring-sky-200 rounded-md px-4 py-2">
            <input bind:value={token} on:keyup={parseDisplayName} type="text" class="bg-transparent outline-none w-full caret-gray-500 placeholder:p-0.5" placeholder="Authorization Token" />
        </div>

        <div class="text-xs text-red-400 select-none cursor-default">
            <p>
                This is a gallery web app exclusive account. Therefore, you must not enter values such as those used for VRC accounts.
            </p>
            <p>
                Furthermore, if you do not know what a token is, you cannot create an account as you are not authorized.
            </p>
        </div>
    
        <button disabled={pw !== pwc} on:click={requestJoin} class="w-full px-4 py-2 bg-rose-300 text-white rounded-md hover:bg-rose-400 disabled:bg-slate-500 transition-colors">
            {#if pw !== pwc}
                The two passwords you entered do not match
            {:else}
                Create a new account
                {#if displayName}
                    as {displayName}
                {/if}
            {/if}
        </button>
    </div>
</div>