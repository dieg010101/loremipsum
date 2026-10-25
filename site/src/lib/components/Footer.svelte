<script lang="ts">
	import './footer.css';

	// grid pages put it bottom left so it does not sit on top of the cards.
	let { side = 'right' }: { side?: 'left' | 'right' } = $props();
</script>

<footer class="footer footer--{side}">
	<a class="link" href="/privacy">
		© {new Date().getFullYear()} lorem ipsum art group. all rights reserved.
	</a>
</footer>
