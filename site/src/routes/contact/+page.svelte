<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
</script>

<svelte:head>
    <title>contact</title>
  </svelte:head>

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
				<a href="https://instagram.com/youdonthavetobeprettyanymore">@loremipsumartgroup</a>
				<p>silk:</p>
				<a href="https://birds.silk.cx/@diego">cx/loremipsum</a>
				<p>substack:</p>
				<a href="https://instagram.com/youdonthavetobeprettyanymore">loremipsumartgroup</a>
				<p>email:</p>
				<a href="https://instagram.com/youdonthavetobeprettyanymore">loremipsum(at)gmail(dot)com</a>
			</div>
		</div>

		<p class="underline text-blue-600 font-thin text-base"><b class="bg-white">contact</b></p>

		<form method="POST" action="?sent" use:enhance class="space-y-2 text-xs w-2/3 max-w-md sm:max-w-lg mx-0">
			<div>
				<p class="text-white font-normal mb-1">name <span class="font-thin">(required)</span></p>
				<input name="name" type="text" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required />
			</div>
			<div>
				<p class="text-white font-normal mb-1">email <span class="font-thin">(required)</span></p>
				<input name="email" type="email" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required />
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
				<a href="https://instagram.com/youdonthavetobeprettyanymore">@loremipsumartgroup</a>
				<p>silk:</p>
				<a href="https://birds.silk.cx/@diego">cx/loremipsum</a>
				<p>substack:</p>
				<a href="https://instagram.com/youdonthavetobeprettyanymore">loremipsumartgroup</a>
				<p>email:</p>
				<a href="https://instagram.com/youdonthavetobeprettyanymore">loremipsum(at)gmail(dot)com</a>
		</div>
	</aside>

	<aside class="w-[40%] px-3 space-y-1">
		<p class="underline text-blue-600 font-thin text-base"><b class="bg-white">contact</b></p>
		<form method="POST" action="?sent" use:enhance class="space-y-2 text-xs w-full max-w-md">
			<div>
				<p class="text-white font-normal mb-1">name <span class="font-thin">(required)</span></p>
				<div class="flex space-x-2">
					<input name="name" type="text" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required />
				</div>
			</div>

			<div>
				<p class="text-white font-normal mb-1">email <span class="font-thin">(required)</span></p>
				<input name="email" type="email" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required />
			</div>

			<div>
				<p class="text-white font-normal mb-1">business name</p>
				<input name="business" type="text" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" />
			</div>

			<div>
				<p class="text-white font-normal mb-1">please describe your business. <span class="font-thin">(required)</span></p>
				<textarea name="bizDesc" rows="4" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required></textarea>
			</div>

			<div>
				<p class="text-white font-normal mb-1">please describe your project. <span class="font-thin">(required)</span></p>
				<textarea name="projDesc" rows="4" class="bg-white text-black outline-none px-0 py-[2px] w-full leading-none tracking-tight focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-white" required></textarea>
			</div>

			<div>
				<button type="submit" class="bg-white px-0.5 py-[0px] text-blue-700 text-sm tracking-tight hover:cursor-pointer hover:bg-gray-400">submit</button>
			</div>
		</form>

		{#if $page.url.searchParams.get('sent')}
			<p class="text-yellow-300 text-xs">message sent. we will get back to you soon!</p>
		{/if}
	</aside>
</div>