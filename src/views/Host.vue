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
			<div id="details_nav" class="flex justify-around gap-6 items-center text-xsm mt-12 text-center text-gray-500">
				<router-link class="flex-1 border-b-2 border-gray-600 pb-3" key="hosts_details" :to="{ name: 'hosts_details_o' }">
					OVERVIEW
				</router-link>
				<router-link class="flex-1 border-b-2 border-gray-600 pb-3" key="hosts_details_d" :to="{ name: 'hosts_details_d' }">
					DETAILS
				</router-link>
				<router-link class="flex-1 border-b-2 border-gray-600 pb-3" key="hosts_details_a" :to="{ name: 'hosts_details_a' }">
					ALERTS
				</router-link>
				<router-link class="flex-1 border-b-2 border-gray-600 pb-3" key="hosts_details_i" :to="{ name: 'hosts_details_i' }">
					INCIDENTS
				</router-link>
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
