<template>
	<div class="details">
		<div role="section" class="mt-4 md:mt-8">
			<div class="w-100 text-gray-100">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4 mb-4 gap-4">
					<div
						v-for="item in alertsList" :key="item.id"
						class="bg-side rounded-lg shadow-lg p-4">
						<div class="flex justify-between">
							<h4 class="text-base self-center">
								{{ item.name }}
							</h4>
							<div class="flex space-x-3">
								<span class="bg-purple-600 py-1 px-2 text-xs rounded-full">{{ item.timing }}"</span>
								<!-- TODO: Improve the tooltip -->
								<div v-if="item.info" class="relative flex flex-col items-center group self-center">
									<span class="leading-none block">
										<span class="cursor-pointer bg-blue-500 py-1 px-2 text-xs rounded-full">?</span>
									</span>
									<div class="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex">
										<!-- TODO: Change the orientation if we're on mobile -->
										<span
											class="relative z-50 p-2 text-xs leading-none text-white whitespace-no-wrap bg-black shadow-lg"
											style="margin-left: calc(100% + 6rem); margin-bottom: -10rem; max-width: 10rem; min-width: calc(100% + 4rem);">
											{{ item.info }}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div class="mt-4 space-y-2">
							<code class="w-full block px-2 whitespace-nowrap overflow-x-auto no-scrollbar">
								$table = {{ item.table }}
							</code>
							<code class="w-full block px-2 whitespace-nowrap overflow-x-auto no-scrollbar">
								$this = {{ item.lookup }}
							</code>
							<code class="w-full block px-2 whitespace-nowrap overflow-x-auto no-scrollbar" v-if="item.where_clause">
								$where = {{ item.where_clause }}
							</code>
							<code class="w-full block p-2 whitespace-nowrap overflow-x-auto no-scrollbar">
								<span class="bg-yellow-600 rounded-lg p-1">$warn</span> = {{ item.warn }}
							</code>
							<code class="w-full block p-2 whitespace-nowrap overflow-x-auto no-scrollbar">
								<span class="bg-red-600 rounded-lg p-1">$crit</span> = {{ item.crit }}
							</code>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { nextTick } from '@vue/runtime-core'
import axios from 'axios'

export default {
	name: 'Alerts',

	data () {
		return {
			alertsList: [],
		}
	},

	mounted: function () {
		const vm = this

		nextTick(() => {
			// This does not auto-refresh, implement a polling (every minute ?)
			axios.get(vm.$apiAlertsUrl + '/api/alerts?uuid=' + vm.$route.params.uuid)
				.then(resp => {
					const dataLength = resp.data.length
					for (let i = 0; i <= dataLength - 1; i++) {
						vm.alertsList.push(resp.data[i])
					}
				})
		})
	},
}
</script>
