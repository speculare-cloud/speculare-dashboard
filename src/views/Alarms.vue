<template>
	<h2 class="text-lg font-medium leading-normal mb-4 text-gray-200">
		Alarms
	</h2>
	<!--
		List all alarms by default
		Also use a color code:
			We'll list all alarms, which mean it'll get messy.
			So we'll group the alarms by groups (if any) if possible.
			If no group is available, we'll display all the alarms grouped by host.
				- If the same alarms is applied to the same host, display it once and add (for: H1, H2, H3, ...)
				- If one alarms exists only for one host, display it normally.

		We'll also give some filter, like per groups, for a specific host or for a matching hostname.

		Don't forget that if an alarms is active (like an incident is ongoing for that said alarms), display it on top in a different category.
	-->
	<table class="table text-gray-400 border-separate space-y-4 text-sm">
		<thead class="bg-gray-800 text-gray-500">
			<tr>
				<th class="p-3">
					Alert name
				</th>
				<th class="p-3 text-center">
					Target.s
				</th>
				<th class="p-3 text-center">
					Status
				</th>
				<th class="p-3 text-center">
					Action
				</th>
			</tr>
		</thead>
		<tbody>
			<tr class="bg-gray-800">
				<td class="p-3">
					<div class="flex align-items-center">
						<img class="rounded-full h-12 w-12 object-cover" src="https://images.unsplash.com/photo-1600856209923-34372e319a5d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2135&q=80" alt="unsplash image">
						<div class="ml-3">
							<div class="">
								Samsung
							</div>
							<div class="text-gray-500">
								mail@rgmail.com
							</div>
						</div>
					</div>
				</td>
				<td class="p-3">
					host.1
				</td>
				<td class="p-3">
					<span class="bg-yellow-400 text-gray-50 rounded-md px-2">active</span>
				</td>
				<td class="p-3">
					<div class="flex">
						<a href="#" class="text-gray-400 hover:text-gray-100 mx-2">
							<svg class="h-6 w-6">
								<use xlink:href="@/assets/imgs/edit.svg#edit" />
							</svg>
						</a>
						<a href="#" class="text-gray-400 hover:text-gray-100 mx-2">
							<svg class="h-6 w-6">
								<use xlink:href="@/assets/imgs/delete.svg#delete" />
							</svg>
						</a>
					</div>
				</td>
			</tr>
		</tbody>
	</table>
</template>

<style scoped>
.table {
	border-spacing: 0 15px;
}

i {
	font-size: 1rem !important;
}

.table tr {
	border-radius: 20px;
}

tr td:nth-child(n+4),
tr th:nth-child(n+4) {
	border-radius: 0 .625rem .625rem 0;
}

tr td:nth-child(1),
tr th:nth-child(1) {
	border-radius: .625rem 0 0 .625rem;
}
</style>

<script>
export default {
	name: 'Alarms'
}
</script>
