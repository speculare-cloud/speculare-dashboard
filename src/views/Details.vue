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
					<p href="#" class="text-gray-500" aria-current="page">{{ this.$route.params.hostname }}</p>
				</li>
			</ul>
		</nav>

		<div role="section" class="mt-8">
			<h3 class="text-2xl text-gray-100 mb-4">CPU</h3>
			<h4 class="text-lg text-gray-200">Utilization</h4>
			<CpuTimes :uuid="this.$route.params.uuid"/>
			<h4 class="text-lg text-gray-200 mt-4">Load</h4>
			<CpuLoad :uuid="this.$route.params.uuid"/>
		</div>
		<div role="section" class="mt-4 mb-12">
			<h3 class="text-2xl text-gray-100 mb-4">Disks</h3>
			<h4 class="text-lg text-gray-200">Io</h4>
			<DisksIoOverall :uuid="this.$route.params.uuid"/>
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
  	},
}
</script>