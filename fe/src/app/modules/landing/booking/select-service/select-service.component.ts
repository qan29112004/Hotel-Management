import { Component, EventEmitter, Input, Output, OnInit, ViewChildren, QueryList, ElementRef, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { ServiceService } from 'app/core/admin/service/service.service';
import { register } from 'swiper/element/bundle';
import { environment } from 'environments/environment.fullstack';

@Component({
  selector: 'app-select-service',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './select-service.component.html',
  styles: ``,
  template: `
    <h2 class="text-lg font-semibold mb-4">Select Services for Room {{ roomIndex + 1 }}</h2>
    <button
      class="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
      (click)="completeService()">
      Confirm Services
    </button>
  `
})
export class SelectServiceComponent implements OnInit {
  @Input() roomIndex!: number;
  @Input() hotelName:string;
  @Input() selectedService:any[];
  @Output() servicesSelected = new EventEmitter<any[]>();
  @Output() servicesRemove = new EventEmitter<any>();

  baseUrl:string = environment.baseUrl;
  list_service:any;
  @ViewChildren('swiperEl') swiperElements!: QueryList<ElementRef>;
  listImageExploreHotel = [
    ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg'],
    ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg']
  ];
  swipers: any[] = [];
  currentIndexes: number[] = [];

  services = signal<any[]>([]);
  listSelectService:any[] = [];

  constructor(private serviceService:ServiceService,private cdr: ChangeDetectorRef) {
    
  }

  ngOnInit(): void {
    const payload = [{
      field:"services_hotel__hotel__name",
      option:'in',
      value:[this.hotelName]
    },
    {
      field:"type",
      option:'contains',
      value:'Add on'
    }
  ]
    this.serviceService.getAllService({filterRules:payload, page_size:0}).subscribe(
      services=>{
        this.services.set(services.data.map(sv=>({...sv, quantity:1})));
        const list = this.services();
        const selected = this.selectedService[this.roomIndex]?.selectedServices ?? [];
        const merged = list.map(service => {
          const found = selected.find(sv => sv.name === service.name);
          return {
            ...service,
            quantity: found ? found.quantity : service.quantity
          };
        });
        this.services.set(merged)
      }
    )
    setTimeout(() => {
      this.initializeSwipers(this.swiperElements,this.swipers, this.currentIndexes);
    }, 0);
    register();
  }

  reAttachQuantity(service:any){
    if (!this.selectedService[this.roomIndex].selectedServices || !service) return false;
    const selectedServices = this.selectedService[this.roomIndex].selectedServices;
  
    // Kiểm tra xem service.name có nằm trong selectedServices hay không
    const isSelected = selectedServices.some(sv => sv.name === service.name);

    // Nếu dịch vụ được chọn, tìm và gán lại quantity cho service
    if (isSelected) {
      // Tìm dịch vụ trong selectedServices có tên trùng với service.name
      const selectedService = selectedServices.find(sv => sv.name === service.name);

      // Nếu tìm thấy, cập nhật quantity của service
      // if (selectedService) {
      //   // service.quantity = selectedService.quantity || 1; // Mặc định là 1 nếu không có quantity
      //   this.services.update(list =>
      //     list.map(item =>
      //       item.name === service.name
      //         ? { ...item, quantity: selectedService.quantity || 1 } // update số lượng
      //         : item // giữ nguyên item khác
      //     )
      //   )
      // }
      return selectedService.quantity || 1
    }
    return null
  }

  checkIsSelect(index:number, service:any){
    if (this.listSelectService.length > 0){
      const exist = this.listSelectService.some(item => item.uuid == service.uuid)
      return exist
    }
    if (!this.selectedService[this.roomIndex].selectedServices){
      return false;
    } 
    let nameServiceSet = new Set(this.selectedService[this.roomIndex].selectedServices.map(sv=>sv.name))
    return nameServiceSet.has(service.name)
    // return false;
  }

  removeService(service: any) {
    this.listSelectService = this.listSelectService.filter(
      (item: any) => item.uuid !== service.uuid
    );
    if(this.selectedService[this.roomIndex].selectedServices.length > 0){
      this.selectedService[this.roomIndex].selectedServices = this.selectedService[this.roomIndex].selectedServices.filter(
        (item: any) => item.uuid !== service.uuid
      )
    }
    console.log("remove sẻvice: ", this.listSelectService)
  }

  selectService(service:any){
    const selectService = {
      uuid:service.uuid,
      name:service.name,
      quantity:service.quantity,
      price:String(Number(service.price) * service.quantity)
    }
    console.log("check service:", selectService)
    this.listSelectService.push(selectService)
  }
  increase(index: number) {
    console.log("chay increase", index)
    console.log("check services", this.services())
    this.services.update(list => {
      const newList = [...list];
      newList[index] = { ...newList[index], quantity: newList[index].quantity + 1 };
      // Nếu service đang được chọn thì update luôn selectedService
      if(this.selectedService[this.roomIndex].selectedServices){
        const selectedServices = this.selectedService[this.roomIndex].selectedServices;
        const found = selectedServices.find(s => s.name === newList[index].name);
        if (found) {
          found.quantity = newList[index].quantity; // mutation fine ở đây vì selectedService không phải signal
        }
      }
      return newList;
    });
    console.log("check services after", this.services())
  }

  decrease(index: number) {
    this.services.update(list => {
      const newList = [...list];
      if (newList[index].quantity > 1) {
        newList[index] = { ...newList[index], quantity: newList[index].quantity - 1 };
      }
      // Nếu service đang được chọn thì update luôn selectedService
      if(this.selectedService[this.roomIndex].selectedServices){
        const selectedServices = this.selectedService[this.roomIndex].selectedServices;
        const found = selectedServices.find(s => s.name === newList[index].name);
        if (found) {
          found.quantity = newList[index].quantity; // mutation fine ở đây vì selectedService không phải signal
        }
      }
      return newList;
    });
  }
  prevSlide(index:number, swipers:any[]) {
    const swiper = swipers[index];
    if (swiper) swiper.slidePrev();
  }

  nextSlide(index:number, swipers:any[]) {
    console.log('next')
    const swiper = swipers[index];
    if (swiper) swiper.slideNext();
  }
  initializeSwipers(swiperElements?: QueryList<ElementRef>, swipers?: any[] ,currentIndexes?: number[]) {
    if (!swiperElements || !swiperElements.length) return;
    console.log('Initializing swipers...', swiperElements);

    swiperElements.forEach((swiperElRef, index) => {
      const swiperEl = swiperElRef.nativeElement;

      // Reset index đầu
      currentIndexes[index] = 0;

      // Add event listeners
      swiperEl.addEventListener('swiperslidechange', (event: any) => {
        const swiperInstance = event.detail?.[0] || swiperEl.swiper;
        if (swiperInstance) {
          currentIndexes[index] = swiperInstance.realIndex;
          this.cdr.detectChanges();
        }
      });

      swiperEl.addEventListener('swiperinit', (e) => {
        swipers[index] = e.detail?.[0] || swiperEl.swiper;
        this.cdr.detectChanges();
        console.log(`Swiper ${index} initialized`, swipers[index]);
      });

      // Cấu hình
      Object.assign(swiperEl, {
        slidesPerView: 1,
        loop: true,
        speed: 300
      });

      swiperEl.initialize();
    });
  }

  convertVNDToUSD(price:string){
    return Number(price)/25000;
  }

  async completeService() {
    let list_service_copy = this.listSelectService
    const list_service = list_service_copy.map(sv=>({
      service_id: sv.uuid,
      quantity: sv.quantity
    }))
    const payload = {
      room_index : this.roomIndex,
      session_id: localStorage.getItem("session_id"),
      services: list_service
    }
    let res_service=[];
    console.log("check payload", payload)
    await this.serviceService.addOrUpdateServiceToHoldRoom(payload).subscribe(res=>{
      res_service = res.data
    })
    this.servicesSelected.emit(this.listSelectService); // demo id services
  }
}
