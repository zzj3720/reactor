import {createApp} from 'vue'
import App from './App.vue'
import {Compiler} from "./reactor/compile/head";
import {ConstBuilder, createMetaLogical, exp, rule} from "./reactor/builder";
import './run'
createApp(App).mount('#app')
