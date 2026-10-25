<script lang="ts">
	import './filter.css';

	type Option = { label: string; href: string; current: boolean };

	type Props = {
		label: string;
		options: Option[];
		// works and webstore can fold the list on desktop too; exhibitions cannot.
		foldsOnDesktop?: boolean;
	};

	let { label, options, foldsOnDesktop = true }: Props = $props();

	// null until the visitor toggles: then css decides (open on desktop, folded on phones).
	let open = $state<boolean | null>(null);
	const id = $derived(`filter-${label.replace(/\W+/g, '-')}`);

	function toggle() {
		const desktop = matchMedia('(min-width: 1024px)').matches;
		open = !(open ?? desktop);
	}
</script>

<div
	class="filter"
	class:filter--open={open === true}
	class:filter--closed={open === false}
	class:filter--fixed={!foldsOnDesktop}
>
	<p class="filter__head">
		<span class="label">{label}</span>
		<button
			class="link filter__toggle"
			type="button"
			aria-expanded={open ?? undefined}
			aria-controls={id}
			aria-label="show {label} options"
			onclick={toggle}>v</button
		>
	</p>
	<ul class="filter__list" {id}>
		{#each options as option (option.href)}
			<li>
				{#if option.current}
					<span class="label" aria-current="true">{option.label}</span>
				{:else}
					<a class="plain-link" href={option.href} data-sveltekit-noscroll>{option.label}</a>
				{/if}
			</li>
		{/each}
	</ul>
</div>
