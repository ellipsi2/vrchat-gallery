<script lang="ts">
    import type { PageData } from './$types';
    
    export let data: PageData;

    let selected = false;

    async function selectDirectory() {
        const a = await window.showDirectoryPicker();

        console.log(a);
    }
</script>

<div class="h-dyn-screen flex flex-row items-center bg-zinc-800 text-white">
    {#if !selected}
        <div class="w-full flex flex-col items-center">
            <div>
                <button class="px-4 py-2 bg-zinc-200/50 text-zinc-800 rounded-md shadow-md shadow-zinc-500">
                    Choose VRChat Photo Directory
                </button>
            </div>
        </div>
    {/if}
</div>