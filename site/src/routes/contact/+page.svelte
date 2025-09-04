<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
  
	// --- Turnstile lazy loader + per-form wiring ------------------------------
  
	let tsScriptLoaded = false;
	function loadTurnstile(): Promise<void> {
	  if (typeof window === 'undefined' || tsScriptLoaded) return Promise.resolve();
	  if ((window as any).turnstile) { tsScriptLoaded = true; return Promise.resolve(); }
	  return new Promise((resolve, reject) => {
		const s = document.createElement('script');
		s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
		s.async = true;
		s.defer = true;
		s.onload = () => { tsScriptLoaded = true; resolve(); };
		s.onerror = () => reject(new Error('Turnstile failed to load'));
		document.head.appendChild(s);
	  });
	}
  
	const widgetByContainer = new WeakMap<Element, any>();
	const skipOnceByForm = new WeakMap<HTMLFormElement, boolean>();
  
	async function ensureWidget(container: HTMLElement, form: HTMLFormElement) {
	  if (!PUBLIC_TURNSTILE_SITE_KEY) return null; // disabled
	  await loadTurnstile();
	  let id = widgetByContainer.get(container);
	  if (!id) {
		id = (window as any).turnstile.render(container, {
		  sitekey: PUBLIC_TURNSTILE_SITE_KEY,
		  size: 'invisible',
		  callback: () => {
			// token is now in hidden input `cf-turnstile-response`
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
		if (!PUBLIC_TURNSTILE_SITE_KEY) return; // Turnstile disabled → normal flow
		const form = formRef();
		if (skipOnceByForm.get(form)) { // second pass after callback()
		  skipOnceByForm.delete(form);
		  return; // allow submit
		}
		e.preventDefault();
		try {
		  const container = containerRef();
		  const id = await ensureWidget(container, form);
		  if (!id) { // shouldn't happen, but fallback
			skipOnceByForm.set(form, true);
			form.requestSubmit();
			return;
		  }
		  (window as any).turnstile.execute(id);
		} catch {
		  // If Turnstile fails to load/execute, fall back (honeypots still protect)
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
  
	// desktop form refs/handlers
	let formDesktop: HTMLFormElement;
	let tsContainerDesktop: HTMLDivElement;
	const { onSubmit: onSubmitDesktop, warmUp: warmUpDesktop } = makeHandlers(
	  () => formDesktop,
	  () => tsContainerDesktop
	);
  
	// mobile form refs/handlers
	let formMobile: HTMLFormElement;
	let tsContainerMobile: HTMLDivElement;
	const { onSubmit: onSubmitMobile, warmUp: warmUpMobile } = makeHandlers(
	  () => formMobile,
	  () => tsContainerMobile
	);
  
	// --------------------------------------------------------------------------
  </script>
  
  <svelte:head>
	<title>Contact Page</title>
	<meta name="description" content="Lorem Ipsum Art Group contact page: social media links & contact form." />
  </svelte:head>
  
  <style>
	/* Honeypots: invisible to users, present for bots */
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
  
  <!-- mobile section. -->
  <div class="lg:hidden flex-1">
	<section class="px-3 space-y-2 mb-8 mt-4">
	  <div class="grid grid-cols-2 gap-6">
		<div>
		  <p class="underline text-blue-600 font-thin text-base"><b class="bg-white">message</b></p>
		  <p class="text-xs mt-1">
			Please do not hesitate to reach out for any creative inquires.
			To ensure clarity and efficiency, please include a brief description of your
			project, timeline, and budget in your initial message. We will respond
			to you as soon as possible.
		  </p>
		</div>
		<div class="break-words">
		  <p class="underline text-blue-600 font-thin text-base"><b class="bg-white">links</b></p>
		  <p>ig:</p>
		  <a href="https://instagram.com/loremipsumartgroup" target="_blank" rel="noopener noreferrer">@loremipsumartgroup</a>
		  <p>email:</p>
		  <a href="mailto:contact@loremipsumartgroup.com" target="_blank" rel="noopener noreferrer">contact@loremipsumartgroup.com</a>
		</div>
	  </div>
  
	  <p class="underline text-blue-600 font-thin text-base"><b class="bg-white">contact</b></p>
  
	  <form
		bind:this={formMobile}
		method="POST"
		action="?sent"
		use:enhance
		class="space-y-2 text-xs w-2/3 max-w-md sm:max-w-lg mx-0"
		autocomplete="off"
		novalidate
		on:submit={onSubmitMobile}
		on:focusin={warmUpMobile}
	  >
		<div>
		  <p class="text-white font-normal mb-1">name <span class="font-thin">(required)</span></p>
		  <input name="name" type="text" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required />
		</div>
		<div>
		  <p class="text-white font-normal mb-1">email <span class="font-thin">(required)</span></p>
		  <input name="email" type="email" inputmode="email" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required />
		</div>
		<div>
		  <p class="text-white font-normal mb-1">business name</p>
		  <input name="business" type="text" class="bbg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" />
		</div>
		<div>
		  <p class="text-white font-normal mb-1">please describe your business. <span class="font-thin">(required)</span></p>
		  <textarea name="bizDesc" rows="4" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required></textarea>
		</div>
		<div>
		  <p class="text-white font-normal mb-1">please describe your project. <span class="font-thin">(required)</span></p>
		  <textarea name="projDesc" rows="4" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required></textarea>
		</div>
  
		<!-- Honeypots -->
		<div class="hp" aria-hidden="true">
		  <label>Website <input type="url" name="website" tabindex="-1" autocomplete="off" /></label>
		  <label>Subject <input type="text" name="subject" tabindex="-1" autocomplete="off" /></label>
		  <label>Nickname <input type="text" name="nickname" tabindex="-1" autocomplete="off" /></label>
		</div>
  
		<!-- Invisible Turnstile mount -->
		{#if PUBLIC_TURNSTILE_SITE_KEY}
		  <div bind:this={tsContainerMobile}></div>
		{/if}
  
		<div>
		  <button type="submit" class="bg-white px-1 py-[0px] text-blue-600 text-sm tracking-tight hover:cursor-pointer hover:bg-gray-400">submit</button>
		</div>
  
		{#if $page.url.searchParams.get('sent')}
		  <p class="text-yellow-300 text-[11px]">message sent. we will get back to you soon!</p>
		{/if}
	  </form>
	</section>
  </div>
  
  <!-- desktop section. -->
  <div class="hidden lg:flex flex-1">
	<aside class="w-[20%] px-3 space-y-4">
	  <div>
		<p class="underline text-blue-600 font-thin text-base"><b class="bg-white">message</b></p>
		<p class="text-xs mt-0">
		  Please do not hesitate to reach out for any creative inquires.
		  To ensure clarity and efficiency, please include a brief description of your
		  project, timeline, and budget in your initial message. We will respond
		  to you as soon as possible.
		</p>
	  </div>
  
	  <div>
		<p class="underline text-blue-600 font-thin text-base"><b class="bg-white">services</b></p>
		<ul class="text-xs mt-0 list-none space-y-1">
		  <li><b class="underline">brand identity & visual language</b><br />logos, typography, color, guidelines</li>
		  <li><b class="underline">merchandising & product design</b><br />apparel, accessories, cut & sew, capsules</li>
		  <li><b class="underline">web & digital experience</b><br />webflow, shopify, ux/ui, digital storytelling</li>
		  <li><b class="underline">creative direction & campaigns</b><br />campaigns, art direction, styling, rollouts</li>
		  <li><b class="underline">packaging & physical touchpoints</b><br />packaging, unboxing, print, collateral</li>
		</ul>
	  </div>
	  <div>
		<p class="underline text-blue-600 font-thin text-base"><b class="bg-white">links</b></p>
		<p>ig:</p>
		<a href="https://instagram.com/loremipsumartgroup" target="_blank" rel="noopener noreferrer">@loremipsumartgroup</a>
		<p>email:</p>
		<a href="mailto:contact@loremipsumartgroup.com" target="_blank" rel="noopener noreferrer">contact@loremipsumartgroup.com</a>
	  </div>
	</aside>
  
	<aside class="w-[40%] px-3 space-y-1">
	  <p class="underline text-blue-600 font-thin text-base"><b class="bg-white">contact</b></p>
  
	  <form
		bind:this={formDesktop}
		method="POST"
		action="?sent"
		use:enhance
		class="space-y-2 text-xs w-full max-w-md"
		autocomplete="off"
		novalidate
		on:submit={onSubmitDesktop}
		on:focusin={warmUpDesktop}
	  >
		<div>
		  <p class="text-white font-normal mb-1">name <span class="font-thin">(required)</span></p>
		  <div class="flex space-x-2">
			<input name="name" type="text" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required />
		  </div>
		</div>
  
		<div>
		  <p class="text-white font-normal mb-1">email <span class="font-thin">(required)</span></p>
		  <input name="email" type="email" inputmode="email" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required />
		</div>
  
		<div>
		  <p class="text-white font-normal mb-1">business name</p>
		  <input name="business" type="text" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-white" />
		</div>
  
		<div>
		  <p class="text-white font-normal mb-1">please describe your business. <span class="font-thin">(required)</span></p>
		  <textarea name="bizDesc" rows="4" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-white" required></textarea>
		</div>
  
		<div>
		  <p class="text-white font-normal mb-1">please describe your project. <span class="font-thin">(required)</span></p>
		  <textarea name="projDesc" rows="4" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-white" required></textarea>
		</div>
  
		<!-- Honeypots -->
		<div class="hp" aria-hidden="true">
		  <label>Website <input type="url" name="website" tabindex="-1" autocomplete="off" /></label>
		  <label>Subject <input type="text" name="subject" tabindex="-1" autocomplete="off" /></label>
		  <label>Nickname <input type="text" name="nickname" tabindex="-1" autocomplete="off" /></label>
		</div>
  
		<!-- Invisible Turnstile mount -->
		{#if PUBLIC_TURNSTILE_SITE_KEY}
		  <div bind:this={tsContainerDesktop}></div>
		{/if}
  
		<div>
		  <button type="submit" class="bg-white px-0.5 py-[0px] text-blue-700 text-sm tracking-tight hover:cursor-pointer hover:bg-gray-400">submit</button>
		</div>
	  </form>
  
	  {#if $page.url.searchParams.get('sent')}
		<p class="text-yellow-300 text-xs">message sent. we will get back to you soon!</p>
	  {/if}
	</aside>
  </div>