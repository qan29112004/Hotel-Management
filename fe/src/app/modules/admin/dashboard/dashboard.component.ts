import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexDataLabels,
    ApexFill,
    ApexLegend,
    ApexPlotOptions,
    ApexResponsive,
    ApexStroke,
    ApexTooltip,
    ApexXAxis,
    ApexYAxis,
    ChartComponent,
    ApexNonAxisChartSeries,
    ApexTitleSubtitle,
    ApexGrid,
    NgApexchartsModule,
    ApexAnnotations,
    ApexOptions 
} from 'ng-apexcharts';
import { FuseSplashScreenService } from '@fuse/services/splash-screen';
import { DashBoardService } from 'app/core/admin/dashboard/dashboard.service';
import { RatingComponent } from 'app/shared/components/rating/rating.component';
@Component({
    standalone: true,
    imports: [NgApexchartsModule, CommonModule, RatingComponent],
    selector: 'admin-dashboard-kpi',
    templateUrl: './dashboard.component.html',
})
export class DashboardKpiComponent {
    @ViewChild('revenueChart') revenueChart?: ChartComponent;
    @ViewChild('bookingStatusChart') bookingStatusChart?: ChartComponent;
    @ViewChild('occupancyChart') occupancyChart?: ChartComponent;
    @ViewChild('userChart') userChart?: ChartComponent;

    data:any;

    avgRating: number = 4.3;
    totalReview: number = 1280;
    title = "star-angular";
    stars = [1, 2, 3, 4, 5];

    Math = Math;

    revenueChartOptions:ApexOptions= {
            
        
        chart: {
            animations: {
                enabled: true,
                speed: 1500,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            type: 'line',
            height: 320,
            toolbar: { show: false },
        },
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        dataLabels: {
            enabled: false,
        },
        colors: ['#3b82f6', '#22c55e'],
        legend: {
            position: 'top',
        },
    };

    bookingStatusChartOptions :ApexOptions= {
        chart: {
            animations: {
                enabled: true,
                speed: 1500,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            type: 'donut',
            height: 300,
        },
        legend: {
            position: 'bottom',
        },
        colors: ['#fbbf24', '#22c55e', '#ef4444', '#3b82f6', '#6366f1', '#9ca3af'],
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${val.toFixed(1)}%`,
        },
    };

    occupancyChartOptions:ApexOptions = {
        
        chart: {
            animations: {
                enabled: true,
                speed: 1500,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            type: 'bar',
            height: 320,
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '40%',
                distributed: true,
            },
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${Math.round(val * 100)}%`,
        },
        
        yaxis: {
            max: 1,
            labels: {
                formatter: (val: number) => `${Math.round(val * 100)}%`,
            },
        },
        colors: ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#e11d48'],
    };

    userChartOptions:ApexOptions = {
        series: [
            {
                name: 'Người dùng mới',
                data: [50, 80, 65, 90, 120, 110, 140, 150, 160, 170, 200, 220],
            },
        ],
        chart: {
            animations: {
                enabled: true,
                speed: 1500,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            type: 'line',
            height: 320,
            toolbar: { show: false },
        },
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        xaxis: {
            categories: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        },
        dataLabels: {
            enabled: false,
        },
        colors: ['#6366f1'],
    };

    constructor(private splashScreen: FuseSplashScreenService, private dashboardService: DashBoardService ) {
        this.splashScreen.hide();
        this.dashboardService.getDashboardOverview().subscribe(res=>{
            console.log("check res dashboard: ", res.data)
            this.data = res.data;
            this.setViewRevenue('month', res.data);
            this.occupancyChartOptions = {
                ...this.occupancyChartOptions,
                series: [{name: 'Tỷ lệ lấp phòng', data: this.data.occupancy.map(item=>item.occupancyRate)}],
                xaxis: {categories: this.data.occupancy.map(item=>item.hotelName)}
            }
            this.bookingStatusChartOptions = {
                ...this.bookingStatusChartOptions,
                series:this.data.bookingStatus.map(item => item.count),
                labels: this.data.bookingStatus.map(item=>item.status)
            }
        })
    }

    setViewRevenue(view:'month'|'week', data?:any){
        // Monthly
        const months = data.revenue.monthly.map((m) => `T${m.month}`);
        const monthlyTotals = data.revenue.monthly.map((m) => m.total);
    
        // Weekly
        const weeklyTotals = data.revenue.weekly.map((w) => w.total);
        const weeks = data.revenue.weekly.map((w) => `${w.weekStart}
        tới 
        ${w.weekEnd}`); // sửa weekStart, weekEnd
    
        if(view === 'month'){
            this.revenueChartOptions = {
                ...this.revenueChartOptions,
                series: [{name: 'Tháng', data: monthlyTotals}],
                xaxis: {categories: months}
            }
        }
        else if(view === 'week'){
            this.revenueChartOptions = {
                ...this.revenueChartOptions,
                series: [{name: 'Tuần', data: weeklyTotals}],
                xaxis: {categories: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4']}
            }
        }
    }


    get totalRevenue(){
        return this.data?.revenue.monthly.reduce((acc, curr) => acc + curr.total, 0);
    }
    get avrOccupancy(){
        return this.data?.occupancy.reduce((acc, curr) => acc + curr.occupancyRate * 100, 0) / this.data.occupancy.length;
    }
}


