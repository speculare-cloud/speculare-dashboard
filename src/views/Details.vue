<template>
	<div class="details">
		<nav class="text-sm font-medium leading-normal mb-4 text-gray-200" aria-label="Breadcrumb">
			<ul class="flex text-sm lg:text-base">
				<li class="inline-flex items-center">
					<router-link to="/" v-slot="{ href, navigate }" custom>
						<a :href="href" @click="navigate">
							<svg class="h-6 w-6">
    							<use xlink:href="@/assets/imgs/home.svg#home" />
  							</svg>
						</a>
					</router-link>
					<svg class="h-5 w-auto" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
					</svg>
				</li>
				<li class="inline-flex items-center" v-for="(breadcrumb, idx) in this.$route.meta.breadcrumb" :key="idx">
					<router-link :to="'/' + breadcrumb.link" v-slot="{ href, navigate }" custom>
						<a :href="href" @click="navigate">{{ breadcrumb.name }}</a>
					</router-link>
					<svg class="h-5 w-auto" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
					</svg>
				</li>
				<li class="inline-flex items-center">
					<p href="#" class="text-gray-400" aria-current="page">{{ this.$route.params.hostname }}</p>
				</li>
			</ul>
		</nav>

		<div role="section" class="mt-4 md:mt-8">
			<h3 class="text-2xl text-gray-100 mb-4">cpu</h3>
			<p class="text-sm text-gray-200">Total CPU utilization. 100% here means there is no CPU idle time at all.</p>
			<CpuTimes :uuid="this.$route.params.uuid"/>
			<h3 class="text-2xl text-gray-100 mb-4 mt-4">load</h3>
			<p class="text-sm text-gray-200">System load. The 3 metrics refer to 1, 5 and 15 minutes averages. Computed once every 5 seconds.</p>
			<CpuLoad :uuid="this.$route.params.uuid"/>
		</div>
		<div role="section" class="mt-4">
			<h3 class="text-2xl text-gray-100 mb-4">disks</h3>
			<p class="text-sm text-gray-200">Total Disk I/O for all physical disks. Physical are disks present in <code>/sys/block</code> but don't have a <code>{}/device</code> in it.</p>
			<DisksIoOverall :uuid="this.$route.params.uuid"/>
		</div>
		<div role="section" class="mt-4">
			<h3 class="text-2xl text-gray-100 mb-4">ram</h3>
			<p class="text-sm text-gray-200">System Randam Access Memory (i.e. physical memory) usage.</p>
			<Ram :uuid="this.$route.params.uuid"/>
		</div>
		<div role="section" class="mt-4 mb-12">
			<h3 class="text-2xl text-gray-100 mb-4">swap</h3>
			<p class="text-sm text-gray-200">System swap memory usage. Swap space is used when the RAM if full.</p>
			<Swap :uuid="this.$route.params.uuid"/>
		</div>
		<div role="section" class="mt-4 mb-12">
			<h3 class="text-2xl text-gray-100 mb-4">network</h3>
			<p class="text-sm text-gray-200">Total bandwidth of all physical network interfaces. Physical are all the network interfaces that are listed in <code>/proc/net/dev</code>, but do not exist in <code>/sys/devices/virtual/net</code>.</p>
			<IoCounters :uuid="this.$route.params.uuid"/>
		</div>

		<button class="p-3 bg-gray-700 rounded-md hover:bg-gray-800 focus:outline-none fixed bottom-8 right-8" @click="open = !open">
			<img src="@/assets/imgs/graph_custom.svg" class="w-6 h-6 inline-block" />
		</button>

		<div class="modal fixed w-full h-full top-0 left-0 items-center justify-center p-4" :class="{'flex': open, 'hidden': !open}">
			<div class="modal-container bg-gray-700 mx-auto rounded shadow-lg z-50 overflow-y-auto">
				<div class="modal-content py-4 text-left px-6">
					<!-- Body -->
					<div class="">
						<div class="">
							<p class="text-lg text-gray-100 mb-4">Quick selector</p>
							<select class="form-select block w-full py-1">
								<option></option>
								<option selected="selected">Last 5 minutes</option>
								<option>Last 15 minutes</option>
								<option>Last 30 minutes</option>
								<option>Last 1 hour</option>
								<option>Last 3 hours</option>
								<option>Last 6 hours</option>
							</select>
						</div>
						<div class="mt-4">
							<p class="text-lg text-gray-100 mb-4">Range selector</p>
							<DatePicker v-model="range" :max-date="new Date()" color="teal" is-range is-dark>
								<template v-slot="{ inputValue, inputEvents, isDragging }">
									<div class="flex flex-col sm:flex-row justify-start items-center">
										<div class="relative flex-grow">
											<svg class="text-gray-600 w-4 h-full mx-2 absolute pointer-events-none"
												fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
												viewBox="0 0 24 24" stroke="currentColor">
												<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
											</svg>
											<input class="flex-grow pl-8 pr-2 py-1 bg-gray-100 border rounded w-full"
												:class="isDragging ? 'text-gray-600' : 'text-gray-900'"
												:value="inputValue.start" v-on="inputEvents.start" />
										</div>
										<span class="flex-shrink-0 m-2">
											<svg class="w-4 h-4 stroke-current text-gray-600" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
											</svg>
										</span>
										<div class="relative flex-grow">
											<svg class="text-gray-600 w-4 h-full mx-2 absolute pointer-events-none"
												fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
												viewBox="0 0 24 24" stroke="currentColor">
												<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
											<input class="flex-grow pl-8 pr-2 py-1 bg-gray-100 border rounded w-full"
												:class="isDragging ? 'text-gray-600' : 'text-gray-900'"
												:value="inputValue.end" v-on="inputEvents.end"/>
										</div>
									</div>
								</template>
							</DatePicker>
						</div>
						<!-- NOTE - Assume the data is collected every seconds at first as this influence the scale -->
						<!-- TODO - Fetch dynamically the scale (the every seconds part of the above), it depends on the config -->
						<!-- TODO - Add selection for "Last 5/15/30 minutes/hours + custom scale" -->
						<!-- TODO - Add selection for begin at -->
						<!-- TODO - Add selection for end at -->
					</div>

					<!-- Footer -->
					<div class="flex justify-between mt-4">
						<button @click="open = false">
							<svg class="fill-current text-white" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
								<path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
							</svg>
						</button>
						<div>
							<button class="px-4 bg-transparent p-2 rounded-md text-green-500 hover:bg-gray-800 hover:text-green-400 mr-2" @click="clearSelection">Clear</button>
							<button class="px-4 bg-green-500 p-2 rounded-md text-white hover:bg-green-600" @click="applySelection">Apply</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Skeleton from '@/components/Graphs/Utils/Skeleton';
import DatePicker from 'v-calendar/lib/components/date-picker.umd'

export default {
	name: 'Details',
	components: {
		DatePicker,
		CpuTimes: () => ({
			component: import('@/components/Graphs/CpuTimes'),
			loading: Skeleton
		}),
		CpuLoad: () => ({
      		component: import('@/components/Graphs/CpuLoad.vue'),
      		loading: Skeleton,
    	}),
		DisksIoOverall: () => ({
			component: import('@/components/Graphs/DisksIoOverall'),
			loading: Skeleton
		}),
		Ram: () => ({
			component: import('@/components/Graphs/Ram'),
			loading: Skeleton
		}),
		Swap: () => ({
			component: import('@/components/Graphs/Swap'),
			loading: Skeleton
		}),
		IoCounters: () => ({
			component: import('@/components/Graphs/IoCounters'),
			loading: Skeleton
		}),
  	},

	data() {
		return {
			open: false,
			trueRange: null,
			trueScale: 5,
			range: {
      			start: null,
      			end: null
    		},
		};
	},

	methods: {
		clearSelection: function() {
			// Apply default value for the scale
			this.trueScale = 5;
			// Clear out the range selection
			this.range = {
				start: null,
				end: null
			};
		},
		applySelection: function() {
			// Finally, close the modal
			this.open = !open;
		}
	}
}
</script>