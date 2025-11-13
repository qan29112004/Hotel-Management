import { Component, AfterViewInit, ViewChild, ElementRef, Input, Output, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true
})
export class MapComponent implements AfterViewInit {
  @ViewChild('map') private mapContainer!: ElementRef<HTMLElement>;
  private map!: L.Map;
  private markers!: any;
  private hotels = [
    { name: 'Khách sạn A', lat: 21.0300, lng: 105.8500, description: 'Khách sạn sang trọng 5 sao' },
    { name: 'Khách sạn B', lat: 21.0305, lng: 105.8510, description: 'Khách sạn gần trung tâm' },
    { name: 'Khách sạn C', lat: 21.0350, lng: 105.8450, description: 'Khách sạn view hồ đẹp' }
  ];
  @Input() listData:any[] = [];

  constructor() {
    // Khắc phục lỗi icon mặc định của Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/images/map/marker-icon-2x.png',
      iconUrl: 'assets/images/map/marker-icon.png',
      shadowUrl: 'assets/images/map/marker-shadow.png'
    });
  }

  ngAfterViewInit(): void {
    // Khởi tạo bản đồ bao quát Việt Nam
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [16.0, 108.0], // trung tâm Việt Nam
      zoom: 6, 
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
      worldCopyJump: true,
      scrollWheelZoom: false,
      inertia: false,              // 🚫 TẮT HOÀN TOÀN QUÁN TÍNH
      inertiaDeceleration: 0
    });

    // Thêm tiles (cho phép lặp lại vô hạn)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors & CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    // Định nghĩa icon cho marker
    const hotelIcon = L.icon({
      iconUrl: 'assets/images/map/hotel-icon.png',
      iconSize: [52, 52],
      iconAnchor: [26, 52], // Điều chỉnh iconAnchor cho iconSize [52, 52]
      popupAnchor: [0, -52]
    });
    // Tạo layer group cho clustering
    this.markers = (L as any).markerClusterGroup({
      maxClusterRadius: 100,
      disableClusteringAtZoom: 15,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: true,
      iconCreateFunction: function(cluster: any) {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 10) size = 'medium';
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: [70, 70]
        });
      }
    });
    console.log('this listdata: ',this.listData)
    // Thêm marker và bản sao vô hạn
    this.listData.forEach(hotel => {
      // Marker gốc
      console.log("check:", hotel.latitude, hotel.longitude)
      const marker = L.marker([parseFloat(hotel.latitude), parseFloat(hotel.longitude)], { icon: hotelIcon });
      marker.bindPopup(`<b>${hotel.name}</b><br>${hotel.description}`);
      this.markers.addLayer(marker);

      // Thêm bản sao marker ở ±360°, ±720°, v.v.
      const maxCopies = 20; // Giới hạn số lần lặp để tránh quá tải
      for (let i = 1; i <= maxCopies; i++) {
        [-360, 360].forEach(direction => {
          const newLng = parseFloat(hotel.longitude) + direction * i;
          const copyMarker = L.marker([parseFloat(hotel.latitude), newLng], { icon: hotelIcon });
          copyMarker.bindPopup(`<b>${hotel.name}</b><br>${hotel.description} (Copy)`);
          this.markers.addLayer(copyMarker);
        });
      }
    });

    // Thêm cluster group vào bản đồ
    this.map.addLayer(this.markers);

    let fixedLat = this.map.getCenter().lat;

    // Khi zoom nhỏ nhất thì khóa trục dọc
    this.map.on('zoomend', () => {
      if (this.map.getZoom() === this.map.getMinZoom()) {
        fixedLat = this.map.getCenter().lat;
      }
    });

    this.map.on('move', () => {
      if (this.map.getZoom() === this.map.getMinZoom()) {
        const center = this.map.getCenter();
        if (Math.abs(center.lat - fixedLat) > 0.0001) {
          this.map.setView([fixedLat, center.lng], this.map.getZoom(), { animate: false });
        }
      }
    });

    // Xử lý click vào cluster (ngăn tách cluster)
    // Xử lý click cluster: zoom vào thay vì tách
    this.markers.on('clusterclick', (event: any) => {
      event.originalEvent.preventDefault();
      const cluster = event.layer;
      const center = cluster.getLatLng();
      const bounds = cluster.getBounds();
      const zoomLevel = this.map.getBoundsZoom(bounds);

      const currentZoom = this.map.getZoom();
      const targetZoom = Math.min(zoomLevel - 1, this.map.getMaxZoom() - 1);

      // Bước 1: bay đến tâm cụm (giữ nguyên zoom)
      this.map.flyTo(center, currentZoom, {
        animate: true,
        duration: 1.5
      });

      // Bước 2: sau khi bay xong → zoom dần vào cụm
      setTimeout(() => {
        this.map.flyTo(center, targetZoom, {
          animate: true,
          duration: 1.0
        });
      }, 1000); // thời điểm bắt đầu zoom (đồng bộ với bước 1)
    });

    // Xử lý click vào marker riêng lẻ
    this.markers.on('click', (event: any) => {
      const marker = event.layer;
      this.map.setView(marker.getLatLng(), 13, { animate: true });
    });

    // Đảm bảo bản đồ hiển thị đúng khi load
    setTimeout(() => this.map.invalidateSize(), 100);
  }
  ngOnChanges(changes: SimpleChanges): void {
    // Phát hiện thay đổi input listData
    if (changes['listData'] && this.map && this.markers) {
      console.log('listData updated:', this.listData);  // Debug để check data mới
      this.addMarkers();  // Cập nhật marker với data mới
    }
  }

  private addMarkers(): void {
    // Clear marker cũ để tránh duplicate
    this.markers.clearLayers();

    console.log('Adding this.markers from listData:', this.listData.length);  // Debug số lượng

    // Định nghĩa icon cho marker (giữ nguyên)
    const hotelIcon = L.icon({
      iconUrl: 'assets/images/map/hotel-icon.png',
      iconSize: [52, 52],
      iconAnchor: [26, 52],
      popupAnchor: [0, -52]
    });

    // Thêm marker và bản sao (giữ nguyên logic)
    this.listData.forEach(hotel => {
      // Kiểm tra dữ liệu hợp lệ (latitude/longitude phải tồn tại và là number/string)
      if (!hotel.latitude || !hotel.longitude) {
        console.warn('Invalid hotel coordinates:', hotel);  // Debug nếu thiếu field
        return;
      }

      // Marker gốc
      console.log("Adding marker:", hotel.name, hotel.latitude, hotel.longitude);  // Debug từng hotel
      const marker = L.marker([parseFloat(hotel.latitude), parseFloat(hotel.longitude)], { icon: hotelIcon });
      marker.bindPopup(`<b>${hotel.name}</b><br>${hotel.description || 'No description'}`);
      this.markers.addLayer(marker);

      // Thêm bản sao marker ở ±360°, ±720°, v.v. (giữ nguyên)
      const maxCopies = 20;
      for (let i = 1; i <= maxCopies; i++) {
        [-360, 360].forEach(direction => {
          const newLng = parseFloat(hotel.longitude) + direction * i;
          const copyMarker = L.marker([parseFloat(hotel.latitude), newLng], { icon: hotelIcon });
          copyMarker.bindPopup(`<b>${hotel.name}</b><br>${hotel.description || 'No description'} (Copy)`);
          this.markers.addLayer(copyMarker);
        });
      }
    });

    // Refresh bản đồ sau khi add (để cluster update)
    this.map.invalidateSize();
  }
}