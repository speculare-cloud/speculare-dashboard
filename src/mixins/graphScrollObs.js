const graphScrollObs = {
	methods: {
		graphScrollObs (fetching, cleaning) {
			// Observe if the $el is visible or not
			return new IntersectionObserver((entries) => {
				if (entries[0].intersectionRatio > 0) {
					fetching()
				} else {
					cleaning()
				}
			}, {
				// Trigger 100px before and after
				rootMargin: '258px 0px 258px 0px',
				// Trigger as soon as 0.001 is in the threttleshot
				threshold: 0.001
			})
		}
	}
}

export default graphScrollObs
