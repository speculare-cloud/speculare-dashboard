<template>
	<div class="details">
		<nav class="text-sm font-medium leading-normal mb-4 text-gray-200" aria-label="Breadcrumb">
			<ul class="flex text-sm lg:text-base">
				<li class="inline-flex items-center">
					<router-link to="/" v-slot="{ href, navigate }" custom>
						<a :href="href" @click="navigate">
							<span class="w-6 h-6 material-icons block">
								home
							</span>
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
					<p href="#" class="text-gray-500" aria-current="page">{{ this.$route.params.uuid }}</p>
				</li>
			</ul>
		</nav>

		<div role="section" class="mt-8">
			<h3 class="text-2xl text-gray-100">CPU</h3>
			<h4 class="text-lg text-gray-200">Cpu Freq</h4>
			<CpuFreq :uuid="this.$route.params.uuid"/>
			<h4 class="text-lg text-gray-200">Cpu Load</h4>
			<CpuLoad :uuid="this.$route.params.uuid"/>
		</div>
		<div role="section" class="mt-4">
			<h3 class="text-2xl text-gray-100">Disks</h3>
			<h4 class="text-lg text-gray-200">Throughput</h4>
			<DiskThroughput :uuid="this.$route.params.uuid"/>
		</div>
	</div>
</template>

<script>
import CpuFreq from '@/components/Graphs/CpuFreq';
import CpuLoad from '@/components/Graphs/CpuLoad';
import DiskThroughput from '@/components/Graphs/DiskThroughput';

export default {
	name: 'Details',
	components: {
    	CpuFreq,
		CpuLoad,
		DiskThroughput
  	},
}
</script>