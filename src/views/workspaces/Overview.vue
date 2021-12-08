<template>
	<nav class="font-medium leading-normal mb-4 text-gray-400" aria-label="Breadcrumb">
		<ul class="flex text-xsm uppercase">
			<li>WORKSPACE {{ this.$route.params.slug }}</li>
			<li class="px-2">
				/
			</li>
			<li>OVERVIEW</li>
		</ul>
	</nav>
</template>

<script>
export default {
	name: 'WorkspaceOverview'
}
</script>
