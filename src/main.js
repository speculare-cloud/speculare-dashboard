import { createApp } from 'vue'
import { router } from '@/router'
import { store } from '@/store'
import pluralize from 'pluralize'
import App from '@/App.vue'

import '@/assets/app.css'
import '@/assets/uPlot.css'

const app = createApp(App)

app.use(router)
app.use(store)

app.config.globalProperties.$apiBaseUrl = (process.env.VUE_APP_SERVER_HTTPS === 'NO' ? 'http' : 'https') + '://' + process.env.VUE_APP_SERVER_DOMAIN
app.config.globalProperties.$apiAlertsUrl = (process.env.VUE_APP_ALERTS_HTTPS === 'NO' ? 'http' : 'https') + '://' + process.env.VUE_APP_ALERTS_DOMAIN
app.config.globalProperties.$wsBaseUrl = (process.env.VUE_APP_PGCDC_SECURITY === 'NO' ? 'ws' : 'wss') + '://' + process.env.VUE_APP_PGCDC_DOMAIN

app.config.globalProperties.$filters = {
	pluralize (value, number) {
		return pluralize(value, number)
	}
}

app.mount('#app')
