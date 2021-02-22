<template>
	<div id="app">
		<div id="nav" class="p-8">
			<router-link to="/">Home</router-link>
		</div>
		<div class="container mx-auto">
			<router-view/>
		</div>
	</div>
</template>

<script>
export default {
	name: 'App',
}
</script>

<style>
@import './assets/uPlot.min.css';
#nav a {
	font-weight: bold;
	color: #2c3e50;
}

#nav a.router-link-exact-active {
	color: rgb(55, 48, 163);
}

.u-legend {
	text-align: left;
	padding-left: 50px;
}

.u-inline tr {
	margin-right: 8px;
}

.u-series {
	vertical-align: bottom;
}

.u-label {
	font-size: 11px;
}

.u-legend .u-marker {
	width: 14px;
	height: 7px;
	border-radius: 4px;
	overflow: hidden;
}

.u-legend .u-value {
	font-size: 11px;
}

.u-inline.u-live th::after {
	content: none;
}
</style>
