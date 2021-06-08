import { createStore } from 'vuex'

export const store = createStore({
    state() {
        return {
            category: [],
            hosts_values: [],
        }
    },
    mutations: {
        updateHosts(state, payload) {
            state.hosts_values[payload.index] = payload.newdata;
        },
        pushHosts(state, payload) {
            state.hosts_values.push(payload.newdata);
        },
        updateCategory(state, payload) {
            state.category[payload.index] = payload.newdata;
        },
        pushCategory(state, payload) {
            state.category.push(payload.newdata);
        }
    },
})