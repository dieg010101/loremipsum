<script lang="ts">
  export let data: {
    intro: string | null,
    substack: { _id: string; title: string; url: string }[],
    books:    { _id: string; title: string; url: string }[],
    essays:   { _id: string; title: string; url: string }[],
    blogs:    { _id: string; title: string; url: string }[]
  }

  function externalLinks(node: HTMLElement) {
    const setAttrs = (a: HTMLAnchorElement) => {
      a.target = '_blank'
      const currentRel = (a.getAttribute('rel') ?? '').split(' ').filter(Boolean)
      const rel = new Set([...currentRel, 'noopener', 'noreferrer'])
      a.setAttribute('rel', Array.from(rel).join(' '))
    }
    node.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach(setAttrs)
    const observer = new MutationObserver(() => {
      node.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach(setAttrs)
    })
    observer.observe(node, { childList: true, subtree: true })
    return { destroy() { observer.disconnect() } }
  }
</script>

<svelte:head>
    <title>journal</title>
  </svelte:head>

<main use:externalLinks class="flex justify-center px-3 text-xs">
  <div class="w-full max-w-3xl space-y-6">
    <p>
      Miscellany of Lorem Ipsum Art Group interests
      and in-house writing projects, including our 
      <a href="https://latamrob.substack.com/" class="underline decoration-dotted text-white">Substack articles</a>.
    </p>

    {#if data.intro}
      <p class="text-white/80">{data.intro}</p>
    {/if}

    <section class="space-y-2">
      <p class="underline text-blue-600 font-thin text-base"><b class="bg-white">Substack Articles</b></p>
      <ul class="list-none space-y-1 text-white">
        {#each data.substack as item (item._id)}
          <li><a href={item.url} class="underline">{item.title}</a></li>
        {/each}
      </ul>
    </section>
    <section class="space-y-2">
      <p class="underline text-blue-600 font-thin text-base"><b class="bg-white">Books/Short Stories/Poetry</b></p>
      <ul class="list-none space-y-1 text-white">
        {#each data.books as item (item._id)}
          <li><a href={item.url} class="underline">{item.title}</a></li>
        {/each}
      </ul>
    </section>
    <section class="space-y-2">
      <p class="underline text-blue-600 font-thin text-base"><b class="bg-white">Essays and Conversations</b></p>
      <ul class="list-none space-y-1 text-white">
        {#each data.essays as item (item._id)}
          <li><a href={item.url} class="underline">{item.title}</a></li>
        {/each}
      </ul>
    </section>
    <section class="space-y-2">
      <p class="underline text-blue-600 font-thin text-base"><b class="bg-white">Blogs</b></p>
      <ul class="list-none space-y-1 text-white">
        {#each data.blogs as item (item._id)}
          <li><a href={item.url} class="underline">{item.title}</a></li>
        {/each}
      </ul>
    </section>

    <hr class="border-t border-white" />
    <p>
      <a href="mailto:placeholderemail@gmail.com" class="underline decoration-dotted text-white">
        placeholderemail@gmail.com
      </a>
    </p>
  </div>
</main>