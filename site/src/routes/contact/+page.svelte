<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	let tsScriptLoaded = false;
	function loadTurnstile(): Promise<void> {
		if (typeof window === 'undefined' || tsScriptLoaded) return Promise.resolve();
		if ((window as any).turnstile) {
			tsScriptLoaded = true;
			return Promise.resolve();
		}
		return new Promise((resolve, reject) => {
			const s = document.createElement('script');
			s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
			s.async = true;
			s.defer = true;
			s.onload = () => {
				tsScriptLoaded = true;
				resolve();
			};
			s.onerror = () => reject(new Error('Turnstile failed to load'));
			document.head.appendChild(s);
		});
	}

	const widgetByContainer = new WeakMap<Element, any>();
	const skipOnceByForm = new WeakMap<HTMLFormElement, boolean>();

	async function ensureWidget(container: HTMLElement, form: HTMLFormElement) {
		if (!PUBLIC_TURNSTILE_SITE_KEY) return null;
		await loadTurnstile();
		let id = widgetByContainer.get(container);
		if (!id) {
			id = (window as any).turnstile.render(container, {
				sitekey: PUBLIC_TURNSTILE_SITE_KEY,
				size: 'invisible',
				callback: () => {
					skipOnceByForm.set(form, true);
					form.requestSubmit();
				}
			});
			widgetByContainer.set(container, id);
		}
		return id;
	}

	function makeHandlers(formRef: () => HTMLFormElement, containerRef: () => HTMLDivElement) {
		const onSubmit = async (e: SubmitEvent) => {
			if (!PUBLIC_TURNSTILE_SITE_KEY) return;
			const form = formRef();
			if (skipOnceByForm.get(form)) {
				skipOnceByForm.delete(form);
				return;
			}
			e.preventDefault();
			try {
				const container = containerRef();
				const id = await ensureWidget(container, form);
				if (!id) {
					skipOnceByForm.set(form, true);
					form.requestSubmit();
					return;
				}
				(window as any).turnstile.execute(id);
			} catch {
				skipOnceByForm.set(form, true);
				form.requestSubmit();
			}
		};
		const warmUp = () => {
			if (!PUBLIC_TURNSTILE_SITE_KEY) return;
			const container = containerRef();
			const form = formRef();
			void ensureWidget(container, form);
		};
		return { onSubmit, warmUp };
	}
	let formDesktop: HTMLFormElement;
	let tsContainerDesktop: HTMLDivElement;
	const { onSubmit: onSubmitDesktop, warmUp: warmUpDesktop } = makeHandlers(
		() => formDesktop,
		() => tsContainerDesktop
	);
	let formMobile: HTMLFormElement;
	let tsContainerMobile: HTMLDivElement;
	const { onSubmit: onSubmitMobile, warmUp: warmUpMobile } = makeHandlers(
		() => formMobile,
		() => tsContainerMobile
	);
</script>

<svelte:head>
	<title>Contact Page</title>
	<meta
		name="description"
		content="Lorem Ipsum Art Group contact page: social media links & contact form."
	/>
</svelte:head>

<!-- mobile. -->
<div class="flex-1 lg:hidden">
	<section class="mt-4 mb-8 space-y-2 px-3">
		<div class="grid grid-cols-2 gap-6">
			<div>
				<p class="text-base font-thin text-blue-600 underline"><b class="bg-white">message</b></p>
				<p class="mt-1 text-xs">
					Please do not hesitate to reach out for any creative inquires. To ensure clarity and
					efficiency, please include a brief description of your project, timeline, and budget in
					your initial message. We will respond to you as soon as possible.
				</p>
			</div>
			<div class="break-words">
				<p class="text-base font-thin text-blue-600 underline"><b class="bg-white">links</b></p>
				<p>ig:</p>
				<a href="https://instagram.com/loremipsumartgroup" target="_blank" rel="noopener noreferrer"
					>@loremipsumartgroup</a
				>
				<p>email:</p>
				<a href="mailto:contact@loremipsumartgroup.com" target="_blank" rel="noopener noreferrer"
					>contact@loremipsumartgroup.com</a
				>
			</div>
		</div>

		<p class="text-base font-thin text-blue-600 underline"><b class="bg-white">contact</b></p>

		<form
			bind:this={formMobile}
			method="POST"
			action="?sent"
			use:enhance
			class="mx-0 w-2/3 max-w-md space-y-2 text-xs sm:max-w-lg"
			autocomplete="off"
			novalidate
			on:submit={onSubmitMobile}
			on:focusin={warmUpMobile}
		>
			<div>
				<p class="mb-1 font-normal text-white">name <span class="font-thin">(required)</span></p>
				<input
					name="name"
					type="text"
					class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1"
					required
				/>
			</div>
			<div>
				<p class="mb-1 font-normal text-white">email <span class="font-thin">(required)</span></p>
				<input
					name="email"
					type="email"
					inputmode="email"
					class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1"
					required
				/>
			</div>
			<div>
				<p class="mb-1 font-normal text-white">business name</p>
				<input
					name="business"
					type="text"
					class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1"
				/>
			</div>
			<div>
				<p class="mb-1 font-normal text-white">
					please describe your business. <span class="font-thin">(required)</span>
				</p>
				<textarea
					name="bizDesc"
					rows="4"
					class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1"
					required
				></textarea>
			</div>
			<div>
				<p class="mb-1 font-normal text-white">
					please describe your project. <span class="font-thin">(required)</span>
				</p>
				<textarea
					name="projDesc"
					rows="4"
					class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1"
					required
				></textarea>
			</div>
			<div class="hp" aria-hidden="true">
				<label>Website <input type="url" name="website" tabindex="-1" autocomplete="off" /></label>
				<label>Subject <input type="text" name="subject" tabindex="-1" autocomplete="off" /></label>
				<label
					>Nickname <input type="text" name="nickname" tabindex="-1" autocomplete="off" /></label
				>
			</div>
			{#if PUBLIC_TURNSTILE_SITE_KEY}
				<div bind:this={tsContainerMobile}></div>
			{/if}

			<div>
				<button
					type="submit"
					class="bg-white px-1 py-[0px] text-sm tracking-tight text-blue-600 hover:cursor-pointer hover:bg-gray-400"
					>submit</button
				>
			</div>

			{#if $page.url.searchParams.get('sent')}
				<p class="text-[11px] text-yellow-300">message sent. we will get back to you soon!</p>
			{/if}
		</form>
	</section>
</div>

<!-- desktop section. -->
<div class="hidden flex-1 lg:flex">
	<aside class="w-[20%] space-y-4 px-3">
		<div>
			<p class="text-base font-thin text-blue-600 underline"><b class="bg-white">message</b></p>
			<p class="mt-0 text-xs">
				Please do not hesitate to reach out for any creative inquires. To ensure clarity and
				efficiency, please include a brief description of your project, timeline, and budget in your
				initial message. We will respond to you as soon as possible.
			</p>
		</div>

		<div>
			<p class="text-base font-thin text-blue-600 underline"><b class="bg-white">services</b></p>
			<ul class="mt-0 list-none space-y-1 text-xs">
				<li>
					<b class="underline">brand identity & visual language</b><br />logos, typography, color,
					guidelines
				</li>
				<li>
					<b class="underline">merchandising & product design</b><br />apparel, accessories, cut &
					sew, capsules
				</li>
				<li>
					<b class="underline">web & digital experience</b><br />webflow, shopify, ux/ui, digital
					storytelling
				</li>
				<li>
					<b class="underline">creative direction & campaigns</b><br />campaigns, art direction,
					styling, rollouts
				</li>
				<li>
					<b class="underline">packaging & physical touchpoints</b><br />packaging, unboxing, print,
					collateral
				</li>
			</ul>
		</div>
		<div>
			<p class="text-base font-thin text-blue-600 underline"><b class="bg-white">links</b></p>
			<p>ig:</p>
			<a href="https://instagram.com/loremipsumartgroup" target="_blank" rel="noopener noreferrer"
				>@loremipsumartgroup</a
			>
			<p>email:</p>
			<a href="mailto:contact@loremipsumartgroup.com" target="_blank" rel="noopener noreferrer"
				>contact@loremipsumartgroup.com</a
			>
		</div>
	</aside>

	<aside class="w-[40%] space-y-1 px-3">
		<p class="text-base font-thin text-blue-600 underline"><b class="bg-white">contact</b></p>

		<form
			bind:this={formDesktop}
			method="POST"
			action="?sent"
			use:enhance
			class="w-full max-w-md space-y-2 text-xs"
			autocomplete="off"
			novalidate
			on:submit={onSubmitDesktop}
			on:focusin={warmUpDesktop}
		>
			<div>
				<p class="mb-1 font-normal text-white">name <span class="font-thin">(required)</span></p>
				<div class="flex space-x-2">
					<input
						name="name"
						type="text"
						class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1"
						required
					/>
				</div>
			</div>

			<div>
				<p class="mb-1 font-normal text-white">email <span class="font-thin">(required)</span></p>
				<input
					name="email"
					type="email"
					inputmode="email"
					class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1"
					required
				/>
			</div>

			<div>
				<p class="mb-1 font-normal text-white">business name</p>
				<input
					name="business"
					type="text"
					class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
				/>
			</div>

			<div>
				<p class="mb-1 font-normal text-white">
					please describe your business. <span class="font-thin">(required)</span>
				</p>
				<textarea
					name="bizDesc"
					rows="4"
					class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
					required
				></textarea>
			</div>

			<div>
				<p class="mb-1 font-normal text-white">
					please describe your project. <span class="font-thin">(required)</span>
				</p>
				<textarea
					name="projDesc"
					rows="4"
					class="w-full bg-white px-0 py-[2px] leading-none tracking-tight text-black outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
					required
				></textarea>
			</div>
			<div class="hp" aria-hidden="true">
				<label>Website <input type="url" name="website" tabindex="-1" autocomplete="off" /></label>
				<label>Subject <input type="text" name="subject" tabindex="-1" autocomplete="off" /></label>
				<label
					>Nickname <input type="text" name="nickname" tabindex="-1" autocomplete="off" /></label
				>
			</div>
			{#if PUBLIC_TURNSTILE_SITE_KEY}
				<div bind:this={tsContainerDesktop}></div>
			{/if}

			<div>
				<button
					type="submit"
					class="bg-white px-0.5 py-[0px] text-sm tracking-tight text-blue-700 hover:cursor-pointer hover:bg-gray-400"
					>submit</button
				>
			</div>
		</form>

		{#if $page.url.searchParams.get('sent')}
			<p class="text-xs text-yellow-300">message sent. we will get back to you soon!</p>
		{/if}
	</aside>
</div>

<style>
	.hp {
		position: absolute !important;
		left: -10000px !important;
		width: 1px !important;
		height: 1px !important;
		overflow: hidden !important;
		opacity: 0 !important;
		pointer-events: none !important;
	}
</style>
