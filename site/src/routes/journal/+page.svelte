<script lang="ts">
	import './journal.css';

	let { data } = $props();

	const s = $derived(data.sections);
	// middle column, then right column on desktop.
	const columns = $derived([
		[
			{ title: 'substack articles', items: s.substack },
			{ title: 'books / short stories / poetry', items: s.books }
		],
		[
			{ title: 'essays and conversations', items: s.essays },
			{ title: 'blogs', items: s.blogs }
		]
	]);
</script>

<svelte:head>
	<title>journal · lorem ipsum art group</title>
	<meta
		name="description"
		content="lorem ipsum art group journal: writing projects and media we appreciate from around the world."
	/>
	<meta property="og:title" content="journal · lorem ipsum art group" />
</svelte:head>

<div class="cols journal">
	<section class="journal__intro">
		<h1 class="label">journal</h1>
		<p>{data.intro}</p>
	</section>

	{#each columns as sections, c (c)}
		<div class="journal__column">
			{#each sections.filter((section) => section.items.length) as section (section.title)}
				<section class="journal__section">
					<h2 class="label">{section.title}</h2>
					<ul class="journal__list">
						{#each section.items as item (item._id)}
							<li>
								<a class="plain-link" href={item.url} target="_blank" rel="noopener noreferrer"
									>{item.title}</a
								>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/each}
</div>
