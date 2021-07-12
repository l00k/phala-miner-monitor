import ModuleLoader from '@/core/Loader/ModuleLoader';
import ServiceLoader from '@/core/Loader/ServiceLoader';
import StoreManager from '@/core/Store/StoreManager';
import AppComponent from '@/core/Vue/AppComponent.vue';
import { Configuration } from '@100k/intiv/Configuration';
import { EventBus } from '@100k/intiv/EventBus';
import { Inject } from '@100k/intiv/ObjectManager';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuex, { Store as VuexStore } from 'vuex';
import isEmpty from 'lodash/isEmpty';


export default class App
{

    @Inject()
    protected configuration : Configuration;

    @Inject()
    protected eventBus : EventBus;

    @Inject()
    protected serviceLoader : ServiceLoader;

    @Inject()
    protected moduleLoader : ModuleLoader;

    protected vue : Vue;

    protected vuexStore : VuexStore<any>;

    protected vueRouter : VueRouter;

    public async run()
    {
        // load configuration
        const configData = require('@/config/configuration').default;
        this.configuration.load(configData);

        // load services
        await this.serviceLoader.load();

        // load routes and init router
        this.vueRouter = new VueRouter({
            mode: 'history',
            base: process.env.BASE_URL,
        });

        // load models
        await this.moduleLoader.load([ 'Domain/Model' ]);

        // setup store and database
        this.vuexStore = new Vuex.Store({
            plugins: [
                StoreManager.getVuexPersister,
            ]
        });

        await import('./Store/Database');

        // load other modules components
        await this.moduleLoader.load([ 'Observer', 'Page', 'Store' ]);

        // load Vue exts
        await this.loadVueExts();

        // init app
        this.vue = new Vue({
            router: this.vueRouter,
            store: this.vuexStore,
            render: h => h(AppComponent),
        });

        await this.vue.$mount('#app');
    }

    public getVueRouter() : VueRouter
    {
        return this.vueRouter;
    }

    public getVuexStore() : VuexStore<any>
    {
        return this.vuexStore;
    }

    protected async loadVueExts()
    {
        const vueExts = await this.moduleLoader.load([ 'Vue' ]);

        for (const vueExt of vueExts) {
            if (isEmpty(vueExt.default)) {
                continue;
            }

            // components
            if (!isEmpty(vueExt.default.components)) {
                for (const name in vueExt.default.components) {
                    Vue.component(name, vueExt.default.components[name]);
                }
            }

            // filters
            if (!isEmpty(vueExt.default.filters)) {
                for (const name in vueExt.default.filters) {
                    Vue.filter(name, vueExt.default.filters[name]);
                }
            }
        }
    }

}
