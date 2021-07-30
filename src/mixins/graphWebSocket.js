const ws = {
	methods: {
		initWS (table, vm) {
			if (vm.graphRange.scale === 300) {
				console.log('[' + table + '] %cStarting %cconnection to WebSocket Server', 'color:green;', 'color:white;')
				if (vm.connection == null) {
					console.log('[' + table + '] > Setting a new webSocket')
					vm.connection = new WebSocket(vm.$wsBaseUrl + '/ws?query=insert:' + table + ':host_uuid.eq.' + vm.uuid)
				}
				// only add the open (at least for the vm.fetching) if we're in realtime
				vm.connection.addEventListener('open', function () {
					console.log('[' + table + '] >> webSocket opened')
					vm.fetching()
				})
				// Setup onmessage listener
				vm.connection.addEventListener('message', vm.wsMessageHandle)
			}
		},
		closeWS (table, vm) {
			console.log('[' + table + '] %cClosing %cthe WebSocket connection', 'color:red;', 'color:white;')
			if (vm.connection != null) {
				console.log('[' + table + '] > Closing the webSocket')
				vm.connection.close()
				vm.connection = null
			}
		}
	}
}

export default ws
