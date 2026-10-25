<script lang="ts">
	import './privacy.css';

	let { data } = $props();

	// fill these in before launch.
	const LAST_UPDATED = '[date]';
	const NEWSLETTER_TOOL = '[newsletter tool]';
</script>

<svelte:head>
	<title>privacy · lorem ipsum art group</title>
	<meta name="description" content="what lorem ipsum art group collects, and what we do with it." />
</svelte:head>

<div class="cols privacy">
	<section class="privacy__body">
		<div class="field">
			<h1 class="label">privacy</h1>
			<p>last updated {LAST_UPDATED}.</p>
		</div>
		<div class="field">
			<h2 class="label">what we collect</h2>
			<p>
				if you sign up for the newsletter: your email address. if you use the contact form: your
				name, email, topic and message.
			</p>
		</div>
		<div class="field">
			<h2 class="label">how we use it</h2>
			<p>to reply to you and to send the newsletter. nothing else. we do not sell or share it.</p>
		</div>
		<div class="field">
			<h2 class="label">where it is kept</h2>
			<p>
				in a private google sheet only lorem ipsum art group can open. newsletters are sent with {NEWSLETTER_TOOL}.
			</p>
		</div>
		<div class="field">
			<h2 class="label">unsubscribing</h2>
			<p>
				every newsletter has an unsubscribe link, or email
				<a class="plain-link" href="mailto:{data.settings.email}">{data.settings.email}</a> and we will
				remove you.
			</p>
		</div>
	</section>
</div>
