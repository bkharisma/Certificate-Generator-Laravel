import axios from 'axios';
import { route } from '../../vendor/tightenco/ziggy';
import type { RouteName } from 'ziggy-js';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

declare global {
    interface Window {
        route: typeof route<RouteName>;
    }
}

window.route = route;
