import { Route } from '@angular/router';
import { DashboardKpiComponent } from './dashboard.component';

export default [
    {
        path: '',
        component: DashboardKpiComponent,
        data: {
            title: 'Dashboard KPI',
        },
    },
] as Route[];


