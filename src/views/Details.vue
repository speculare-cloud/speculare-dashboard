<template>
	<div class="details">
		<h1 class="text-6xl font-normal leading-normal mt-0 mb-2 text-gray-800">Details</h1>
		<p>{{ this.$route.params.uuid }}</p>

		<div role="section" class="mt-8">
			<h3 class="text-2xl">CPU</h3>
			<h4 class="text-lg">Cpu Freq</h4>
			<CpuFreq :uuid="this.$route.params.uuid"/>
			<h4 class="text-lg">Cpu Load</h4>
			<CpuLoad :uuid="this.$route.params.uuid"/>
		</div>
		<div role="section" class="mt-4">
			<h3 class="text-2xl">Disks</h3>
			<h4 class="text-lg">Throughput</h4>
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