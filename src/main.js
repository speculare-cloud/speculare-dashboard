import Vue from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'

import '@/assets/app.css'
import '@/assets/uPlot.css';

Vue.config.productionTip = false
Vue.prototype.$apiBaseUrl = (process.env.VUE_APP_HTTPS == 'NO' ? 'http' : 'https') + '://' + process.env.VUE_APP_API_DOMAIN;
Vue.prototype.$wsBaseUrl = (process.env.VUE_APP_WS_SECURITY == 'NO' ? 'ws' : 'wss') + '://' + process.env.VUE_APP_WS_DOMAIN;

import pluralize from 'pluralize';
Vue.filter('pluralize', function(value, number) {
    return pluralize(value, number)
})

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')