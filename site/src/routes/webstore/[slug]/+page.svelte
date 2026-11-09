<script lang="ts">
	import './item.css';
	import { formatDate, storePrice } from '$lib/format';
	import { sp } from '$lib/spaces';
	import { askHref, buyHref, inExhibitionHref } from '$lib/work';
	import Picture from '$lib/components/Picture.svelte';
	import RichText from '$lib/components/RichText.svelte';

	let { data } = $props();
	const work = $derived(data.work);
	const store = $derived(work.store!);
	const sale = $derived(work.sale);
	const details = $derived([work.lines[0], store.size, store.edition].filter(Boolean));
</script>

<p class="item__crumbs"><a href="/webstore">webstore</a>{sp(2)}→{sp(2)}<em>{work.title}</em></p>

<div class="item grid">
	<div class="item__image">
		{#if work.image}
			<Picture
				image={work.image}
				title={work.title}
				sizes="(min-width: 760px) 50vw, 100vw"
				eager
				href={work.image.full}
			/>
		{/if}
	</div>

	<div class="item__info">
		<h1>
			<span class="strong">{work.artist.name}</span><br /><em>{work.title}</em>, {work.year}{#each details as line, i (i)}<br
				/>{line}{/each}
		</h1>

		<!-- one work, one price, one button. -->
		{#if sale.kind === 'available'}
			<p class="item__price">{storePrice(sale, work.medium)}</p>
			<p class="item__buy">
				<a class="button" href={buyHref(work)} rel={work.checkoutUrl ? 'noopener' : undefined}
					>buy it</a
				><span class="item__or">or <a href={askHref(work)}>ask about it</a></span>
			</p>
			{#if data.shipsFrom}<p class="item__ships">{data.shipsFrom}</p>{/if}
		{:else if sale.kind === 'onRequest'}
			<p class="item__price">price on request</p>
			<p class="item__buy"><a class="button" href={askHref(work)}>ask about it</a></p>
		{:else if sale.kind === 'reserved'}
			<p class="item__state">
				reserved until {formatDate(sale.until, false)}.<br /><a href="{askHref(work)}&amp;notify=1"
					>ask to be told if it’s free again</a
				>
			</p>
		{:else if sale.kind === 'sold'}
			<p class="item__state">
				sold. <a href="{askHref(work)}&amp;similar=1">ask about similar work</a>
			</p>
		{:else}
			<p class="item__state">{storePrice(sale, work.medium)}</p>
		{/if}

		{#if store.about?.length}
			<h2 class="item__heading strong">what you’re buying</h2>
			{#each store.about as paragraph, i (i)}<p class="item__text">
					<RichText text={paragraph} />
				</p>{/each}
		{/if}
		{#if data.moneySplit.length}
			<h2 class="item__heading strong">where the money goes</h2>
			{#each data.moneySplit as paragraph, i (i)}<p class="item__text">
					<RichText text={paragraph} />
				</p>{/each}
		{/if}
		{#if data.shipping.length}
			<h2 class="item__heading strong">shipping and returns</h2>
			{#each data.shipping as paragraph, i (i)}<p class="item__text">
					<RichText text={paragraph} />
				</p>{/each}
		{/if}

		{#if work.exhibition || data.more.length}
			<p class="item__seen">
				{#if work.exhibition}seen in exhibition {work.exhibition.number},
					<a href="/exhibitions/{work.exhibition.number}"><em>{work.exhibition.title}</em></a>.{sp(
						2
					)}<a href={inExhibitionHref(work)}>see it there</a
					>{/if}{#if work.exhibition && data.more.length}<br />{/if}{#if data.more.length}more by {work
						.artist.name}: {#each data.more as m, i (m.href)}{#if i}{', '}{/if}<a href={m.href}
							><em>{m.title}</em></a
						>{/each}{/if}
			</p>
		{/if}
	</div>
</div>
