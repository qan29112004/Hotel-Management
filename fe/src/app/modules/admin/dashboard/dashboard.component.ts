import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { CardDashboardComponent } from './card-dashboard/card-dashboard.component';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';
import { NewsService } from 'app/core/admin/news/news.service';
import { ChatService } from 'app/core/chat/chat.service';
import { UserService } from 'app/core/profile/user/user.service';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import { Subscription } from 'rxjs';
import { AppTypeService } from 'app/core/admin/app-type/app-type.service';
import { ProductService } from 'app/core/admin/market/product/product.service';
import { DashBoardService } from 'app/core/admin/dashboard/dashboard.service';
import { User } from 'app/core/admin/dashboard/dashboard.types';
import { Post } from 'app/core/admin/dashboard/dashboard.types';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
@Component({
    standalone: true,
    selector: 'dashboard',
    imports: [SharedModule, CommonModule, CardDashboardComponent,TranslocoModule],
    templateUrl: './dashboard.component.html',
    styles: ``,
    encapsulation: ViewEncapsulation.None
})

export class DashboardComponent implements OnInit {

    // khai báo
    userName = 'Ram Sam Nguyen';
    userProfileImage = '/assets/images/profile.jpg';

    // khai báo total
    totalProjects = 200;
    salesProgress = 70;
    salesChartData = [];
    hoveredLineIndex: number | null = null;
    totalMessages = 0;
    totalNews = 0 ;
    totalUsers = 0;
    totalApp = 0;
    totalProducts = 0;

    // khhai báo chart
     salesChartYAxisBars = [70, 60, 50, 40, 30, 20, 10, 0];
    salesChartYAxis = [70, 60, 50, 40, 30, 20, 10, 0];
    maxLineChartValue = 0;
    chartWidth = 485;
    chartHeight = 100;
    chartPadding = 1;

    // khai báo phần đăng kí  gần đây
    recentUsers: User[] = [];
    numberOfLike: Post[] = [];
    realtimeUser : any[] = []
    
    // Tooltip/circle width & height
    rectWidth = 36;
    rectHeight = 18;


    // constructor
     constructor(
        private chatService: ChatService,
        private translocoService: TranslocoService,
        private newsService: NewsService,
        private userService: UserManagementService, 
        private appTypeService: AppTypeService,
        private productService: ProductService,
        private dashboardService: DashBoardService
      ) { }

      // phần call api
       async ngOnInit() {
        await this.loadChatData();
        this.loadNews();
        this.loadUsers();
        this.loadApps();
        this.loadProducts();
        this.loadTraffic();
          this.setLabels();

        this.translocoService.langChanges$.subscribe(() => {
          this.setLabels();
        });
         this.setSalesChartData();
      }

      // xử lí từng api
      // messages
      private async loadChatData() {
        this.totalMessages = await this.chatService.countTotalMessages();
      }
      // news
      private loadNews() {
        this.newsService.getAllNews({}).subscribe(([news, totalNews]) => {
          this.totalNews = totalNews;
        });
      }
      // user
      private loadUsers() {
        this.userService.getUsers({}).subscribe((response) => {
          this.totalUsers = response.data.totalUser;
        });
      }

      // app
      private loadApps() {
        this.appTypeService.getAllApp({}).subscribe(([AppType, total]) => {
          this.totalApp = total;
        });
      }

      // product
      private loadProducts() {
        this.productService.getProducts().subscribe(([products, total]) => {
          this.totalProducts = total;
        });
      }
    
      // dashboard
      private loadTraffic() {
        // phần gettrafffic
        this.dashboardService.getTraffic().subscribe(([dashboard, total]) => {
        // load tháng
        const month = Array(12).fill(0) 
        dashboard.forEach(item => {
        const monthIndex = item.month - 1; 
        month[monthIndex] = item.totalUserLogin;
      });
     
        this.lineChartData.datasets[0].data = month;
        
        // chia cột y 
        const max = Math.max(...month);
        let maxWith = max * 2;
        maxWith = Math.ceil(maxWith / 5) * 5; 
        this.maxLineChartValue = maxWith;
        
        const step = maxWith / 4;
        this.salesChartYAxis = []
        for (let v = maxWith ; v >= 0; v -= step) {
           const yValue = Math.floor(v / 5) * 5;
          this.salesChartYAxis.push(yValue);
        }
      });
      this.dashboardService.getRecentRegistered().subscribe((response)=>{
        this.recentUsers = response;
      });
      this.dashboardService.getNumberOffLike().subscribe((response)=>{
          this.numberOfLike = response ;
      });
      this.dashboardService.getdashboardsse().subscribe({
        next: (data) =>
        {
          this.realtimeUser = data
          this.recentUsers = [...data]
        },
        error: (err)=>{
          console.log("lôi" , err)
        }
      });
      }
      lineChartData = {
        labels: [] as string[],
        datasets: [
          {
            data: [] as number[] , 
            label: 'Lượt đăng nhập',

          }
          ]

    };
       getSmoothLinePath(data: number[], width: number, height: number, padding: number = 0): string {
        if (!data || data.length === 0) return ''; 
        const max = this.maxLineChartValue || 1;   
        const innerWidth = width - padding * 2;
        const points = data.map((v, i) => {
            const x = padding + i * (innerWidth / ((data.length - 1) || 1));
            const y = height - (v / max * height);
            return { x, y };
        });
        let d = `M ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx = (prev.x + curr.x) / 2;
            d += ` Q ${cpx},${prev.y} ${curr.x},${curr.y}`;
        }
        return d;
    }
  getStraightLinePath(data: number[], width: number, height: number, padding: number = 0): string {
    if (!data || data.length === 0) return '';
    const max = this.maxLineChartValue || 1;
    const innerWidth = width - padding * 2;
    const points = data.map((v, i) => {
      const x = padding + i * (innerWidth / ((data.length - 1) || 1));
      const y = height - (v / max * height);
      return { x, y };
    });

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x},${points[i].y}`;
    }
    return d;
  }

    getAreaPath(data: number[], width: number, height: number, padding: number = 0): string {
        if (!data || data.length === 0) return '';
        const max = this.maxLineChartValue || 1; 
        const innerWidth = width - padding * 2;
        const points = data.map((v, i) => {
            const x = padding + i * (innerWidth / (data.length - 1 || 1));
            const y = height - (v / max * height);
            return { x, y };
        });
        let d = `M ${points[0].x},${height}`;
        for (let i = 0; i < points.length; i++) {
            d += ` L ${points[i].x},${points[i].y}`;
        }
        d += ` L ${points[points.length - 1].x},${height} Z`;
        return d;
    }

    // time ago
    timeAgo(date: string): string {
      const now = new Date().getTime();
      const past = new Date(date).getTime();
      const diffInSeconds = Math.floor((now - past) / 1000);
        
      if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
      const minutes = Math.floor(diffInSeconds / 60);
      if (minutes < 60) return `${minutes} phút trước`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} giờ trước`;
      return `${Math.floor(hours / 24)} ngày trước`;
    }

    // xử lí get x get y
    // Tính x của điểm i
      getXByMonth(i: number): number {
        const n = this.lineChartData.labels.length; // số tháng
        return this.chartPadding + i * ((this.chartWidth - 2 * this.chartPadding) / (n - 1));
      }
      // Tính y dựa trên giá trị
      getY(value: number): number {
        return this.chartHeight - (value / this.maxLineChartValue * this.chartHeight);
      }

      // Tính X cho tooltip
    getTooltipX(i: number): number {
      const x = this.getXByMonth(i); // lấy x của đỉnh
      const tooltipWidth = this.rectWidth; // chiều rộng tooltip
      if(i === 0) return x; // điểm đầu
      if(i === this.lineChartData.labels.length - 1) return x - tooltipWidth; // điểm cuối
      return x - tooltipWidth / 2; // các điểm giữa
    }

    // Tính Y cho tooltip
    getTooltipY(value: number): number {
      return this.getY(value) - 32; // offset lên trên đỉnh
    }
    // fake data
    stats = {
        attendance: { value: '92/99', change: 2.1 },
        projects: { value: '92/99', change: 2.1 },
        clients: { value: '92/99', change: 2.1 },
        tasks: { value: '92/99', change: -2.1 },
        earnings: { value: '92/99', change: 2.1 },
        profit: { value: '92/99', change: -2.1 },
        applicants: { value: '92/99', change: 2.1 },
        newHire: { value: '92/99', change: 2.1 }
    };

    marketingPlatforms = [
        { name: 'OSX', color: '#4338ca' },
        { name: 'Android', color: '#818cf8' },
        { name: 'Windows', color: '#e0e7ff' },
        { name: 'iOS', color: '#bfdbfe' }
    ];

    salesData = [
        { title: 'Total Revenue', amount: 30000, color: '#4338ca' },
        { title: 'Profit Amount', amount: 30000, color: '#818cf8' },
        { title: 'Total Revenue', amount: 30000, color: '#e0e7ff' },
        { title: 'Profit Amount', amount: 30000, color: '#bfdbfe' }
    ];

    invoices = [
        { name: 'Daniel Estella', email: 'daniel123@gmail.com', amount: 3560, status: 'Unpaid', avatar: '/assets/images/avatar1.jpg' },
        { name: 'Daniel Estella', email: 'daniel123@gmail.com', amount: 3560, status: 'Unpaid', avatar: '/assets/images/avatar2.jpg' },
        { name: 'Daniel Estella', email: 'daniel123@gmail.com', amount: 3560, status: 'Unpaid', avatar: '/assets/images/avatar3.jpg' },
        { name: 'Daniel Estella', email: 'daniel123@gmail.com', amount: 3560, status: 'Paid', avatar: '/assets/images/avatar4.jpg' }
    ];


    setSalesChartData() {
  const categoryKeys = [
    'categories.category1',
    'categories.category4',
    'categories.category5',
    'categories.category6'
  ];

  this.salesChartData = [];
  categoryKeys.forEach((key, index) => {
    this.translocoService.selectTranslate(key).subscribe(name => {
      const values = [60, 25, 40, 35];
      this.salesChartData[index] = {
        name,
        value: values[index],
        percentage: (values[index] * 100) / 70,
        highlighted: index === 0
      };
    });
  });
}  

    hoveredBarIndex: number | null = null;

    departmentData = [
        { name: 'Sales', percentage: 30 },
        { name: 'Marketing', percentage: 80 }
    ];
    
    getLineChartPoints(data: number[], width: number, height: number): string {
        const max = Math.max(...data);
        const gap = width / data.length;
        return data.map((v, i) => {
            const x = gap * i + gap / 2; // căn giữa cột
            const y = height - (v / max * height);
            return `${x},${y}`;
        }).join(' ');
    }


    doughnutChartData = [
        { name: 'CRM', value: 400, color: '#1255fb' },
        { name: 'P2P', value: 400, color: '#127cfb' },
        { name: 'LinkFiin', value: 300, color: '#5d8bfc' }
    ];

    doughnutTotal = this.doughnutChartData.reduce((sum, item) => sum + item.value, 0);

    // Tính phần trăm, dasharray, và offset
    doughnutSegments = this.doughnutChartData.map(item => (item.value / this.doughnutTotal) * 100);

    public hoveredDoughnutIndex: number | null = null;

    // Tính offset cho từng phần của doughnut chart
    getDoughnutOffset(index: number): number {
        let offset = 0;
        for (let i = 0; i < index; i++) {
            const percent = (this.doughnutChartData[i].value / this.doughnutTotal) * 75.4;
            //   console.log(`Offset for index ${i}: -${percent}`);
            offset -= percent;
        }
        return offset;
    }


    // Hàm trả về path SVG cho từng phần của doughnut chart
    getDoughnutArcPath(index: number): string {
        const r = 12;
        const cx = 18;
        const cy = 18;
        const total = this.doughnutTotal;
        const circumference = 2 * Math.PI * r;
      
        let startAngle = 0;
        for (let i = 0; i < index; i++) {
          startAngle += (this.doughnutChartData[i].value / total) * 360;
        }
      
        const angle = (this.doughnutChartData[index].value / total) * 360;
        const endAngle = startAngle + angle;
      
        const start = this.polarToCartesian(cx, cy, r, endAngle);
        const end = this.polarToCartesian(cx, cy, r, startAngle);
      
        const largeArcFlag = angle > 180 ? 1 : 0;
      
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
      }
      
      polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number): { x: number, y: number } {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
          x: cx + r * Math.cos(angleInRadians),
          y: cy + r * Math.sin(angleInRadians)
        };
      }
      

      mostLikedPosts = [
        {
          title: 'Top 5 ứng dụng quản lý công việc tốt nhất 2025',
          likes: 1287,
          author: 'Nguyễn Văn D',
          date: '2025-07-14',
          excerpt: 'Khám phá các ứng dụng giúp bạn quản lý công việc hiệu quả hơn mỗi ngày...',
          image: '/assets/images/ui/blog-top.png'
        },
        {
          title: 'Bí quyết tăng năng suất làm việc tại nhà',
          likes: 1023,
          author: 'Trần Thị H',
          date: '2025-07-10',
          excerpt: 'Làm việc tại nhà có thể hiệu quả nếu bạn biết áp dụng những nguyên tắc sau...',
          image: '/assets/images/ui/blog-home.png'
        },
        {
          title: 'Cách xây dựng thói quen làm việc bền vững',
          likes: 980,
          author: 'Lê Minh K',
          date: '2025-07-08',
          excerpt: 'Thói quen là chìa khóa để làm việc hiệu quả lâu dài. Dưới đây là cách bắt đầu...',
          image: '/assets/images/ui/blog-habit.png'
        }
      ];
      



setLabels() {
  const keys = [
    'months.jan', 'months.feb', 'months.mar',
    'months.apr', 'months.may', 'months.jun',
    'months.jul', 'months.aug', 'months.sep',
    'months.oct', 'months.nov', 'months.dec'
  ];

  forkJoin(
    keys.map(key => this.translocoService.selectTranslate(key).pipe(take(1)))
  ).subscribe(labels => {
    this.lineChartData.labels = labels;
  });
}

    addProject(): void {
        console.log('Adding new project');
        // Implement your add project logic here
    }
}
