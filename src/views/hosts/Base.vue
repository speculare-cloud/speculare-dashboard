<template>
	<div class="details">
		<nav class="font-medium leading-normal mb-4 text-gray-400" aria-label="Breadcrumb">
			<ul class="flex text-xsm uppercase">
				<li class="text-green-400 mr-2" style="font-size:0.65rem;">
					&#x25C0;
				</li>
				<li>WORKSPACE {{ this.$route.params.slug }}</li>
				<li class="px-2">
					/
				</li>
				<li>SERVERS</li>
			</ul>
			<div class="flex mt-8 text-green-400 text-2xl font-normal">
				<img src="@/assets/imgs/up_right.svg" class="w-6 h-3">
				<p class="ml-2" style="margin-top:-6px">
					{{ this.$route.params.hostname }}
				</p>
			</div>
			<div id="details_nav" class="flex-grow overflow-y-auto border-b border-gray-800">
				<div class="sm:pt-8 pt-4 flex flex-col w-full text-white">
					<div class="flex items-center space-x-3">
						<router-link class="px-3 border-b-2 pb-1.5 border-transparent text-gray-400" key="hd_overview" :to="{ name: 'hd_overview' }">
							Overview
						</router-link>
						<router-link class="px-3 border-b-2 pb-1.5 border-transparent text-gray-400" key="hd_details" :to="{ name: 'hd_details' }">
							Details
						</router-link>
						<router-link class="px-3 border-b-2 pb-1.5 border-transparent text-gray-400" key="hd_alerts" :to="{ name: 'hd_alerts' }">
							Alerts
						</router-link>
						<router-link class="px-3 border-b-2 pb-1.5 border-transparent text-gray-400" key="hd_incidents" :to="{ name: 'hd_incidents' }">
							Incidents
						</router-link>
						<!-- TODO: Setup the page -->
						<a href="#" class="px-3 border-b-2 border-transparent text-gray-400 pb-1.5">Settings</a>
					</div>
				</div>
			</div>
		</nav>

		<router-view />
	</div>
</template>

<script>
export default {
	name: 'Base'
}
</script>
