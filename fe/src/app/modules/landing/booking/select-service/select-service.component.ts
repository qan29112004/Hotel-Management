import { Component, EventEmitter, Input, Output, OnInit, ViewChildren, QueryList, ElementRef, ChangeDetectorRef, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { ServiceService } from 'app/core/admin/service/service.service';
import { register } from 'swiper/element/bundle';
import { environment } from 'environments/environment.fullstack';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-select-service',
  standalone: true,
  imports: [CommonModule, SharedModule, TranslocoModule],
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
export class SelectServiceComponent implements OnInit, OnChanges {
  @Input() roomIndex!: number;
  @Input() hotelName:string;
  @Input() selectedService:any[];
  @Output() servicesSelected = new EventEmitter<any[]>();
  @Output() servicesRemove = new EventEmitter<any>();

  baseUrl:string = environment.baseUrl;
  @ViewChildren('swiperEl') swiperElements!: QueryList<ElementRef>;
  listImageExploreHotel = [
    ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg'],
    ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg']
  ];
  swipers: any[] = [];
  currentIndexes: number[] = [];

  services = signal<any[]>([]);
  listSelectService:any[] = [];
  private hasServiceCatalogLoaded = false;

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
  register();
    this.serviceService.getAllService({filterRules:payload, page_size:0}).subscribe(
      services=>{
        this.services.set(services.data.map(sv=>({...sv, quantity:1})));
        this.hasServiceCatalogLoaded = true;
        console.log("check has service catalog loaded init", this.hasServiceCatalogLoaded)
        this.hydrateSelectedServices();
      }
    )
    setTimeout(() => {
      this.initializeSwipers(this.swiperElements,this.swipers, this.currentIndexes);
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedService'] || changes['roomIndex']) {
      this.hasServiceCatalogLoaded = true;
      this.hydrateSelectedServices();
    }
  }

  reAttachQuantity(service:any){
    if (!service) return null;
    const matched = this.listSelectService.find(sv => this.isSameService(sv, service));
    return matched ? matched.quantity || 1 : null
  }

  checkIsSelect(service:any){
    if (!service) {
      return false;
    }
    if (this.listSelectService.length > 0){
      return this.listSelectService.some(item => this.isSameService(item, service));
    }
    const persisted = this.selectedService?.[this.roomIndex]?.services ?? [];
    return persisted.some((sv:any) => this.isSameService(sv, service));
  }

  removeService(service: any) {
    this.listSelectService = this.listSelectService.filter(
      (item: any) => !this.isSameService(item, service)
    );
    this.persistSelectionToParent();
    console.log("remove service: ", this.listSelectService)
  }

  selectService(service:any){
    const selectService = {
      uuid:service.uuid,
      name:service.name,
      quantity:service.quantity,
      price:String(Number(service.price) * service.quantity)
    }
    console.log("check service:", selectService)
    this.listSelectService = [
      ...this.listSelectService.filter(item => !this.isSameService(item, selectService)),
      selectService
    ];
    this.persistSelectionToParent();
  }
  increase(index: number) {
    console.log("chay increase", index)
    console.log("check services", this.services())
    this.services.update(list => {
      const newList = [...list];
      newList[index] = { ...newList[index], quantity: newList[index].quantity + 1 };
      this.updateSelectedQuantityFromCatalog(newList[index]);
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
      this.updateSelectedQuantityFromCatalog(newList[index]);
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

  private hydrateSelectedServices(): void {
    if (!this.hasServiceCatalogLoaded) {
      console.log("check has service catalog loaded", this.hasServiceCatalogLoaded)
      return;
    }
    const room = this.selectedService?.[this.roomIndex];
    console.log("check room", room)
    const persisted = room?.services ?? [];
    console.log("check persisted", persisted)
    this.listSelectService = persisted.map(service => ({ ...service }));
    console.log("check list select service", this.listSelectService)
    if (!persisted.length) {
      this.services.update(list =>
        list.map(service => ({ ...service, quantity: 1 }))
      );
      return;
    }
    this.services.update(list =>
      list.map(service => {
        const matched = persisted.find(sv => this.isSameService(sv, service));
        return matched
          ? { ...service, quantity: matched.quantity ?? service.quantity ?? 1 }
          : service;
      })
    );
    console.log("check services after hydrate", this.services())
  }

  private isSameService(source: any, target: any): boolean {
    // console.log("check source", source)
    if (!source || !target) {
      return false;
    }
    if (source.uuid && target.uuid) {
      return source.uuid === target.uuid;
    }
    if (source.service_id && target.uuid) {
      return source.service_id === target.uuid;
    }
    if (source.uuid && target.service_id) {
      return source.uuid === target.service_id;
    }
    return source.name === target.name;
  }

  private persistSelectionToParent(): void {
    if (!this.selectedService || !this.selectedService[this.roomIndex]) {
      return;
    }
    this.selectedService[this.roomIndex].services = this.listSelectService.map(item => ({ ...item }));
  }

  private updateSelectedQuantityFromCatalog(service: any): void {
    if (!service) {
      return;
    }
    let hasUpdate = false;
    this.listSelectService = this.listSelectService.map(item => {
      if (this.isSameService(item, service)) {
        hasUpdate = true;
        return {
          ...item,
          quantity: service.quantity,
          price: String(Number(service.price) * service.quantity)
        };
      }
      return item;
    });
    if (hasUpdate) {
      this.persistSelectionToParent();
    }
  }
}
