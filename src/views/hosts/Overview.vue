<template>
	<div class="details">
		<!-- Incidents display: max 2 -->
		<div class="md:mt-8">
			<!-- Level: critical -->
			<a class="block mt-4 px-4 py-3 uppercase text-xsm font-medium" style="background-color: #f46565; color: #520303;"
				href="#">
				<span class="font-semibold mr-2">/ / <span class="ml-2">Incidents:</span></span> alert_name is ongoing since 10 minutes.
			</a>
			<!-- Level: warning -->
			<!-- <a class="block mt-4 px-4 py-4 uppercase text-xsm font-medium" style="background-color: #f4cf65; color: #382a03;"
				href="#">
				<span class="font-semibold mr-2">/ / <span class="ml-2">Incidents:</span></span> alert_name is ongoing since 5 minutes.
			</a> -->
		</div>
	</div>
</template>

<script>
export default {
	name: 'Overview'
}
</script>
