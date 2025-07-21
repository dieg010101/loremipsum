module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}', './app.html'],
	theme: {
		extend: {
			fontFamily: {
				// Helvetica-style sans-serif
				// 15 ultra thin. font-weight: 100.
				// 25 thin. font-weight: 200.
				'neue-haas': ['"neue-haas-grotesk-display"', 'sans-serif'],

				// Modern serif for headlines
				// normal + normal italic. font-weight: 400, font-style: normal/italic.
				// bold. font-weight: 700.
				// bold italic. font-weight: 700, font-style: italic.
				'meno-text': ['"meno-text"', 'serif']
			}
		}
	},
	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};
