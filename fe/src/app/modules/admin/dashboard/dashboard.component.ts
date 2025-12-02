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
    ApexOptions,
    ApexMarkers
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

    data: any;
    currentView: 'month' | 'week' = 'month';

    avgRating: number = 4.3;
    totalReview: number = 1280;
    title = "star-angular";
    stars = [1, 2, 3, 4, 5];

    Math = Math;

    // Common Chart Styles for Neo-Brutalism
    commonChartFont = {
        fontFamily: 'monospace, sans-serif',
        fontWeight: 'bold',
    };

    revenueChartOptions: ApexOptions = {
        chart: {
            animations: { enabled: true, speed: 800 },
            type: 'line',
            height: 320,
            toolbar: { show: false },
            fontFamily: 'monospace'
        },
        stroke: {
            curve: 'straight', // Brutalist = Straight lines
            width: 4,
        },
        dataLabels: { enabled: false },
        colors: ['#000000', '#FBBF24'], // Black & Yellow
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontWeight: 'bold',
            labels: { colors: '#000' }
        },
        grid: {
            borderColor: '#000',
            strokeDashArray: 0, // Solid grid lines
            xaxis: { lines: { show: true } }   
        },
        xaxis: {
            labels: { style: { colors: '#000', fontWeight: 'bold' } },
            axisBorder: { show: true, color: '#000' },
            axisTicks: { show: true, color: '#000' }
        }
    };

    bookingStatusChartOptions: ApexOptions = {
        chart: {
            type: 'donut',
            height: 350,
            fontFamily: 'monospace'
        },
        legend: {
            position: 'bottom',
            fontSize: '14px',
            fontWeight: 'bold',
            labels: { colors: '#000' },
            itemMargin: { horizontal: 10, vertical: 5 }
        },
        // Vibrant colors + Black/Gray for contrast
        colors: ['#FBBF24', '#22c55e', '#ef4444', '#3b82f6', '#000000', '#9ca3af'], 
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${val.toFixed(0)}%`,
            style: {
                fontSize: '14px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                colors: ['#000'] // Black text on charts
            },
            dropShadow: { enabled: false }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'TOTAL',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#000'
                        }
                    }
                }
            }
        },
        
    };

    occupancyChartOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 320,
            toolbar: { show: false },
            fontFamily: 'monospace'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                distributed: true,
                borderRadius: 0, // No rounded corners
                dataLabels: { position: 'top' }
            },
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${Math.round(val * 100)}%`,
            style: {
                fontSize: '12px',
                fontWeight: 'bold',
                colors: ['#000']
            },
            offsetY: -20
        },
        yaxis: {
            max: 1,
            labels: {
                formatter: (val: number) => `${Math.round(val * 100)}%`,
                style: { colors: '#000', fontWeight: 'bold' }
            },
        },
        xaxis: {
            labels: { style: { colors: '#000', fontWeight: 'bold' } },
            axisBorder: { show: true, color: '#000' },
        },
        grid: {
            borderColor: '#e5e7eb',
            strokeDashArray: 4,
            show: true
        },
        stroke: {
            width: 2,
            colors: ['#000'] // Black border around bars
        },
        colors: ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#e11d48'],
    };

    userChartOptions: ApexOptions = {
        series: [
            {
                name: 'Người dùng mới',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6],
            },
        ],
        chart: {
            type: 'line',
            height: 320,
            toolbar: { show: false },
            fontFamily: 'monospace'
        },
        stroke: {
             // Step line for brutalist feel
            width: 3,
        },
        xaxis: {
            categories: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
            labels: { style: { colors: '#000', fontWeight: 'bold' } },
            axisBorder: { show: true, color: '#000' },
        },
        yaxis: {
            labels: { style: { colors: '#000', fontWeight: 'bold' } }
        },
        dataLabels: { enabled: false },
        colors: ['#6366f1'],
        grid: {
            borderColor: '#000',
            strokeDashArray: 2,
            xaxis: { lines: { show: true } }
        },
        markers: {
            size: 6,
            strokeWidth: 2,
            strokeColors: '#000',
            hover: { size: 8 }
        }
    };

    constructor(private splashScreen: FuseSplashScreenService, private dashboardService: DashBoardService) {
        this.splashScreen.hide();
        this.dashboardService.getDashboardOverview().subscribe(res => {
            console.log("check res dashboard: ", res.data)
            this.data = res.data;
            this.setViewRevenue('month', res.data);
            this.occupancyChartOptions = {
                ...this.occupancyChartOptions,
                series: [{ name: 'Tỷ lệ lấp phòng', data: this.data.occupancy.map(item => item.occupancyRate) }],
                xaxis: { 
                    ...this.occupancyChartOptions.xaxis,
                    categories: this.data.occupancy.map(item => item.hotelName) 
                }
            }
            this.bookingStatusChartOptions = {
                ...this.bookingStatusChartOptions,
                series: this.data.bookingStatus.map(item => item.count),
                labels: this.data.bookingStatus.map(item => item.status)
            }
        })
    }

    setViewRevenue(view: 'month' | 'week', data?: any) {
        this.currentView = view;
        // Monthly
        const months = data.revenue.monthly.map((m) => `T${m.month}`);
        const monthlyTotals = data.revenue.monthly.map((m) => m.total);

        // Weekly
        const weeklyTotals = data.revenue.weekly.map((w) => w.total);
        // Clean up text for visual cleanliness
        const weeks = data.revenue.weekly.map((w, index) => `Tuần ${index + 1}`);

        if (view === 'month') {
            this.revenueChartOptions = {
                ...this.revenueChartOptions,
                series: [{ name: 'Doanh thu', data: monthlyTotals }],
                xaxis: { ...this.revenueChartOptions.xaxis, categories: months }
            }
        }
        else if (view === 'week') {
            this.revenueChartOptions = {
                ...this.revenueChartOptions,
                series: [{ name: 'Doanh thu', data: weeklyTotals }],
                xaxis: { ...this.revenueChartOptions.xaxis, categories: weeks }
            }
        }
    }

    get totalRevenue() {
        return this.data?.revenue.monthly.reduce((acc, curr) => acc + curr.total, 0);
    }
    get avrOccupancy() {
        if(!this.data?.occupancy?.length) return 0;
        return this.data?.occupancy.reduce((acc, curr) => acc + curr.occupancyRate * 100, 0) / this.data.occupancy.length;
    }
}