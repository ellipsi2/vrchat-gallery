<script lang="ts">
	import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    
    export let data: PageData;

    let pwInput: HTMLInputElement;
    let id = '';
    let pw = '';

    async function requestLogin() {
        const res = await fetch('/api/auth', {
            method: 'POST',
            body: JSON.stringify({
                id,
                pw,
            }),
        });
        const {redir} = await res.json();
        goto(redir);
    }

    async function checkEnter(event: KeyboardEvent, type: 0 | 1) {
        if (event.key === 'Enter') {
            if (type === 0) {
                return pwInput.focus();
            }

            if (type === 1) {
                return requestLogin();
            }

            throw new Error('Unhandled: Login');
        }
    }
</script>

<svelte:head>
    <title>Login - vrc.now.gd</title>
</svelte:head>

<div class="h-dyn-screen flex flex-row items-center">
    <div class="p-4 flex flex-col gap-2 w-10/12 sm:w-4/6 md:w-1/2 lg:w-1/3 mx-auto">
        <div class="ring-1 ring-rose-200 rounded-md px-4 py-2">
            <input bind:value={id} on:keydown={(e) => checkEnter(e, 0)} type="text" class="bg-transparent outline-none w-full caret-gray-500 placeholder:p-0.5" placeholder="ID" />
        </div>
    
        <div class="ring-1 ring-rose-200 rounded-md p px-4 py-2">
            <input bind:this={pwInput} bind:value={pw} on:keydown={(e) => checkEnter(e, 1)} type="password" class="bg-transparent outline-none w-full caret-gray-500 placeholder:p-0.5" placeholder="PW" />
        </div>

        <button on:click={requestLogin} class="w-full py-2 bg-rose-200 text-white rounded-md hover:bg-rose-400 transition-colors">
            Login
        </button>
    </div>
</div>