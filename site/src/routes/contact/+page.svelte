<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
</script>

<div class="hidden lg:flex flex-1">
	<aside class="w-[20%] px-3 space-y-4">
		<div>
			<p class="underline text-blue-600 font-thin text-base">
				<b class="bg-white">message</b>
			</p>
			<p class="text-xs mt-0">
				Please do not hesitate to reach out for any creative inquires.
				To ensure clarity and efficiency, please include a brief description of your
				project, timeline, and budget in your initial message. We will respond
				to you as soon as possible.
			</p>
		</div>

		<div>
			<p class="underline text-blue-600 font-thin text-base">
				<b class="bg-white">services</b>
			</p>
			<ul class="text-xs mt-0 list-none space-y-1">
				<li>
					<b class="underline">brand identity & visual language</b><br />
					logos, typography, color, guidelines
				</li>
				<li>
					<b class="underline">merchandising & product design</b><br />
					apparel, accessories, cut & sew, capsules
				</li>
				<li>
					<b class="underline">web & digital experience</b><br />
					webflow, shopify, ux/ui, digital storytelling
				</li>
				<li>
					<b class="underline">creative direction & campaigns</b><br />
					campaigns, art direction, styling, rollouts
				</li>
				<li>
					<b class="underline">packaging & physical touchpoints</b><br />
					packaging, unboxing, print, collateral
				</li>
			</ul>
		</div>

		<div>
			<p class="underline text-blue-600 font-thin text-base">
				<b class="bg-white">______</b>
			</p>
			<p>ig:</p>
			<a href="https://instagram.com/youdonthavetobeprettyanymore">@instagramhand;e</a>
			<p>silk:</p>
			<a href="https://birds.silk.cx/@diego">cx/diego</a>
			<p>email:</p>
			<a href="https://instagram.com/youdonthavetobeprettyanymore">bleh(at)gmail(dot)com</a>
		</div>
	</aside>

	<aside class="w-[40%] px-3 space-y-4">
		<p class="underline text-blue-600 font-thin text-base">
			<b class="bg-white">contact</b>
		</p>

		<form
			method="POST"
			action="?sent"
			use:enhance
			class="space-y-4 text-xs"
		>
			<div>
				<p class="text-white font-normal mb-1">
					name <span class="font-thin">(required)</span>
				</p>
				<div class="flex space-x-2">
					<input
						name="name"
						type="text"
						placeholder="Your name"
						class="bg-white text-blue-500 border-0 border-b-2 border-blue-600 outline-none px-0 py-[2px] w-full leading-none tracking-tight"
						required
					/>
				</div>
			</div>

			<div>
				<p class="text-white font-normal mb-1">
					email <span class="font-thin">(required)</span>
				</p>
				<input
					name="email"
					type="email"
					placeholder="janedoe@gmail.com"
					class="bg-white text-blue-500 border-0 border-b-2 border-blue-600 outline-none w-full px-0 py-[2px] leading-none tracking-tight"
					required
				/>
			</div>

			<div>
				<p class="text-white font-normal mb-1">business name</p>
				<input
					name="business"
					type="text"
					placeholder="Your Business"
					class="bg-white text-blue-500 border-0 border-b-2 border-blue-600 outline-none w-full px-0 py-[2px] leading-none tracking-tight"
				/>
			</div>

			<div>
				<p class="text-white font-normal mb-1">
					please describe your business. <span class="font-thin">(required)</span>
				</p>
				<textarea
					name="bizDesc"
					rows="4"
					class="bg-white text-blue-500 border-0 border-b-2 border-blue-600 outline-none w-full px-0 py-[2px] leading-none tracking-tight resize-none"
					required
				></textarea>
			</div>

			<div>
				<p class="text-white font-normal mb-1">
					please describe your project. <span class="font-thin">(required)</span>
				</p>
				<textarea
					name="projDesc"
					rows="4"
					class="bg-white text-blue-500 border-0 border-b-2 border-blue-600 outline-none w-full px-0 py-[2px] leading-none tracking-tight resize-none"
					required
				></textarea>
			</div>

			<div>
				<button
					type="submit"
					class="bg-white px-0 py-[0px] text-blue-600 underline text-sm tracking-tight"
				>
					submit
				</button>
			</div>
		</form>

		{#if $page.url.searchParams.get('sent')}
			<p class="text-yellow-300 text-xs">message sent. we will get back to you soon!</p>
		{/if}
	</aside>
</div>