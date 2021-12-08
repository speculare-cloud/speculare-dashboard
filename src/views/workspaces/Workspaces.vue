<template>
	<div class="antialiased bg-core">
		<div class="min-h-screen w-full px-8 md:px-36 overflow-x-auto
			flex flex-col align-middle items-center justify-center">
			<h2 class="text-lg font-medium leading-normal mb-4 text-gray-200">
				WORKSPACES
			</h2>
			<div class="md:flex md:flex-row md:gap-6">
				<router-link key="One" :to="{ name: 'workspace', params: { slug: 'One' } }">
					<div class="md:w-64 flex items-center text-gray-200 bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg hover:bg-gray-600 hover:text-gray-100">
						<div class="flex justify-center items-center rounded-full w-12 h-12" style="background-color: #004878">
							<img :src="require('@/assets/imgs/server.svg')"
								:alt="3"
								class="w-6 h-8"
								width="2rem"
								height="2rem">
						</div>
						<div class="py-1 ml-4">
							<h3 class="font-medium">
								Workspace One
							</h3>
							<p class="text-sm text-gray-400">
								4 SERVERS
							</p>
						</div>
					</div>
				</router-link>
				<router-link key="Two" :to="{ name: 'workspace', params: { slug: 'Two' } }">
					<div class="mt-6 md:mt-0 md:w-64 flex items-center text-gray-200 bg-gray-800 relative shadow px-4 py-3 rounded-md hover:bg-gray-600 hover:text-gray-100">
						<div class="flex justify-center items-center rounded-full w-12 h-12" style="background-color: #004878">
							<img :src="require('@/assets/imgs/server.svg')"
								:alt="3"
								class="w-6 h-8"
								width="2rem"
								height="2rem">
						</div>
						<div class="py-1 ml-4">
							<h3 class="font-medium">
								Workspace Two
							</h3>
							<p class="text-sm text-gray-400">
								2 SERVERS
							</p>
						</div>
					</div>
				</router-link>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Workspaces'
}
</script>
