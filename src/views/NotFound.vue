<template>
	<div id="notfound">
		<div class="notfound">
			<h1 class="text-gray-200">404</h1>
			<h2 class="text-gray-200">Oops! Page Not Found</h2>
			<p class="text-gray-400">Sorry but the page you are looking for does not exist, have been removed, name changed or is temporarily unavailable</p>
			<router-link to="/" class="flex items-center py-2">
				<svg class="h-6 w-6 mr-2">
					<use xlink:href="@/assets/imgs/arrow_back.svg#arrow_back" />
				</svg>
				<div>Back to homepage</div>
			</router-link>
		</div>
	</div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Nunito:400,700');
* {
	-webkit-box-sizing: border-box;
	box-sizing: border-box
}

body {
	padding: 0;
	margin: 0
}

#notfound {
	background-color: rgb(17, 24, 39);
	position: relative;
	height: 100vh
}

#notfound .notfound {
	position: absolute;
	left: 50%;
	top: 50%;
	-webkit-transform: translate(-50%, -50%);
	-ms-transform: translate(-50%, -50%);
	transform: translate(-50%, -50%)
}

.notfound {
	max-width: 560px;
	width: 100%;
	line-height: 1.1
}

.notfound h1 {
	font-family: nunito, sans-serif;
	font-size: 65px;
	font-weight: 700;
	margin-top: 0;
	margin-bottom: 10px;
	text-transform: uppercase
}

.notfound h2 {
	font-family: nunito, sans-serif;
	font-size: 21px;
	font-weight: 400;
	margin: 0;
	margin-bottom: 10px;
	text-transform: uppercase;
}

.notfound p {
	font-family: nunito, sans-serif;
	color: #999fa5;
	font-weight: 400
}

.notfound a {
	font-family: nunito, sans-serif;
	font-weight: 700;
	border-radius: 40px;
	margin-top: 10px;
	text-decoration: none;
	color: #388dbc
}

@media only screen and (max-width:767px) {
	.notfound .notfound-404 {
		width: 110px;
		height: 110px
	}
	.notfound {
		padding-left: 15px;
		padding-right: 15px;
		padding-top: 110px
	}
}
</style>
