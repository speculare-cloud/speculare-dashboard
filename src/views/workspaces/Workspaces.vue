<template>
	<div class="antialiased bg-core">
		<div
			class="min-h-screen w-full px-8 md:px-36 overflow-x-auto
			flex flex-col align-middle items-center justify-center">
			<h2 class="text-lg font-medium leading-normal mb-4 text-gray-200">
				WORKSPACES
			</h2>
			<div class="md:flex md:flex-row md:gap-6">
				<router-link key="default" :to="{ name: 'workspace', params: { slug: 'default' } }">
					<div class="md:w-64 flex items-center text-gray-200 bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg hover:bg-gray-600 hover:text-gray-100">
						<div class="flex justify-center items-center rounded-full w-12 h-12" style="background-color: #004878">
							<img
								:src="require('@/assets/imgs/server.svg')"
								:alt="3"
								class="w-6 h-8"
								width="2rem"
								height="2rem">
						</div>
						<div class="py-1 ml-4">
							<h3 class="font-medium">
								Default Workspace
							</h3>
							<p class="text-sm text-gray-400">
								{{ $store.state.hosts_values.length }} SERVERS
							</p>
						</div>
					</div>
				</router-link>
			</div>
			<p class="text-center absolute bottom-4 right-4 left-4 text-sm text-gray-400 italic p-4">
				The ability to create custom workspaces will come later.
			</p>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Workspaces'
}
</script>
