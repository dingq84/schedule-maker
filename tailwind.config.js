module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			colors: {
				purple: {
					blue: {
						primary: {
							500: '#4318FF',
						},
					},
				},
				gray: {
					dark: {
						900: '#1B2559',
					},
					secondary: {
						300: '#F4F7FE',
						600: '#A3AED0',
						900: '#2B3674',
					},
				},
				green: {
					primary: {
						100: '#05CD99',
					},
				},
			},
		},
	},
	plugins: [],
}
