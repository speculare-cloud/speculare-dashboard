<template>
	<div class="details">
		<nav class="font-medium leading-normal mb-4 text-gray-400" aria-label="Breadcrumb">
			<ul class="flex text-xsm">
				<li class="text-green-400 mr-2" style="font-size:0.65rem;">
					&#x25C0;
				</li>
				<li>WORKSPACE ONE</li>
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
						<router-link class="px-3 border-b-2 pb-1.5 border-transparent text-gray-400" key="hosts_details" :to="{ name: 'hosts_details_o' }">
							Overview
						</router-link>
						<router-link class="px-3 border-b-2 pb-1.5 border-transparent text-gray-400" key="hosts_details_d" :to="{ name: 'hosts_details_d' }">
							Details
						</router-link>
						<router-link class="px-3 border-b-2 pb-1.5 border-transparent text-gray-400" key="hosts_details_a" :to="{ name: 'hosts_details_a' }">
							Alerts
						</router-link>
						<router-link class="px-3 border-b-2 pb-1.5 border-transparent text-gray-400" key="hosts_details_i" :to="{ name: 'hosts_details_i' }">
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
	name: 'Details'
}
</script>
