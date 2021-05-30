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

		<div class="modal fixed w-full h-full top-0 left-0 items-center justify-center" :class="{'flex': open, 'hidden': !open}">
			<div class="modal-container bg-gray-700 w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto">
				<div class="modal-content py-4 text-left px-6">
					<!-- Header -->
					<div class="flex justify-between items-center pb-3">
						<!-- TODO - Add clock svg -->
						<p class="text-xl text-white font-bold">Quick selector</p>
						<button @click="open = false">
							<svg class="fill-current text-white" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
								<path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
							</svg>
						</button>
					</div>

					<!-- Body -->
					<div class="flex">
						<p class="text-gray-200">TODO</p>
						<!-- NOTE - Assume the data is collected every seconds at first as this influence the scale -->
						<!-- TODO - Fetch dynamically the scale (the every seconds part of the above), it depends on the config -->
						<!-- TODO - Add selection for "Last 5/15/30 minutes/hours + custom scale" -->
						<!-- TODO - Add selection for begin at -->
						<!-- TODO - Add selection for end at -->
					</div>

					<!-- Footer -->
					<div class="flex justify-end pt-2">
						<button class="px-4 bg-transparent p-2 rounded-md text-green-500 hover:bg-gray-800 hover:text-green-400 mr-2">Clear</button>
						<button class="px-4 bg-green-500 p-2 rounded-md text-white hover:bg-green-600">Apply</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Skeleton from '@/components/Graphs/Utils/Skeleton';

export default {
	name: 'Details',
	components: {
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
			open: false
		};
	},
}
</script>