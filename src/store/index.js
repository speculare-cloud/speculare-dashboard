import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        category: [],
        hosts_values: [],
    },
    mutations: {
        updateHosts(state, payload) {
            Vue.set(state.hosts_values, payload.index, payload.newdata);
        },
        pushHosts(state, payload) {
            state.hosts_values.push(payload.newdata);
        },
        updateCategory(state, payload) {
            Vue.set(state.category, payload.index, payload.newdata);
        },
        pushCategory(state, payload) {
            state.category.push(payload.newdata);
        }
    },
    actions: {},
    modules: {}
})