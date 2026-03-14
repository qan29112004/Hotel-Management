# 🏨 Hotel Booking & Management System (Advanced Backend)

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Framework-Django%204.2-green.svg)](https://www.djangoproject.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Deployment-Docker-blue.svg)](https://www.docker.com/)

Một hệ thống quản lý và đặt phòng khách sạn toàn diện, tập trung vào việc giải quyết các bài toán **High Concurrency** (Xử lý đồng thời cao), **Data Integrity** (Toàn vẹn dữ liệu) và tích hợp **AI (Generative AI)** để tối ưu hóa trải nghiệm người dùng.

---

## 📖 Mục lục
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Các tính năng đột phá](#-các-tính-năng-đột-phá)
- [Chi tiết giải thuật AI (RAG)](#-chi-tiết-giải-thuật-ai-rag)
- [Thách thức kỹ thuật & Giải pháp](#-thách-thức-kỹ-thuật--giải-pháp)
- [Cài đặt và Triển khai](#-cài-đặt-và-triển-khai)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)

---

## 🏗 Kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình **Monolithic tinh gọn** nhưng sẵn sàng mở rộng, kết hợp với các Service bổ trợ:

- **Backend:** Django & Django REST Framework (DRF).
- **Frontend:** Angular & Tailwind CSS.
- **Database:** MySQL (Lưu trữ dữ liệu quan hệ).
- **Cơ chế khóa & Cache:** Redis (Atomic locks, Session, Caching).
- **Xử lý tác vụ nền:** Celery & Redis.
- **AI Engine:** LangGraph, ChromaDB (Vector Database) & ChatGroq API.

---

## 🔥 Các tính năng đột phá

### 1. Hệ thống đặt phòng Concurrency-Safe (An toàn đồng thời)
Đây là trái tim của hệ thống, giúp ngăn chặn tình trạng **Overbooking** (nhiều người đặt cùng 1 phòng tại 1 thời điểm):
- **Redis Lua Scripting:** Thực hiện kiểm tra tính khả dụng và đặt "khóa tạm thời" (hold) phòng một cách nguyên tử (atomic). Điều này đảm bảo không có race condition xảy ra ở cấp độ Database.
- **Booking Sessions:** Sử dụng Redis TTL để tự động giải phóng phòng nếu người dùng không hoàn tất thanh toán trong vòng 10-15 phút.

### 2. Quản lý tác vụ với Celery
- **Scheduling:** Tự động hủy các đơn đặt phòng quá hạn thanh toán.
- **Notification:** Gửi email xác nhận và hóa đơn tự động.
- **Real-time Sync:** Kết hợp với **Server-Sent Events (SSE)** để đồng bộ đồng hồ đếm ngược thanh toán giữa Server và Client.

### 3. Cổng thanh toán đa quốc gia
- Tích hợp **VNPay** cho thị trường nội địa.
- Tích hợp **PayPal** cho khách hàng quốc tế.
- Xử lý Webhooks để cập nhật trạng thái đơn hàng ngay lập tức khi thanh toán thành công.

---

## 🤖 Chi tiết giải thuật AI (RAG)

Không chỉ là một Chatbot thông thường, hệ thống tích hợp **RAG (Retrieval-Augmented Generation)**:

- **LangGraph Workflows:** Định nghĩa các luồng hội thoại phức tạp, giúp bot không bị lạc đề và luôn bám sát dữ liệu khách sạn.
- **Vector Database (ChromaDB):** Lưu trữ thông tin về chính sách, tiện ích và chi tiết phòng dưới dạng Embeddings.
- **Singleton Design Pattern:** Đảm bảo chỉ có một instance của Model LLM được khởi tạo, giúp tối ưu hóa bộ nhớ RAM của Server.
- **Asynchronous Task:** Việc nhúng (embedding) dữ liệu mới được đẩy vào Celery để không làm tắc nghẽn luồng chính của người dùng.

---

## 🛠 Thách thức kỹ thuật & Giải pháp

| Thách thức | Giải pháp |
| :--- | :--- |
| **Race Condition** khi 100 người cùng đặt 1 phòng cuối cùng. | Sử dụng **Redis Lua Script** để thực hiện logic *Check-and-Set* ở mức độ nguyên tử. |
| **Database Overload** do truy vấn danh sách phòng trống liên tục. | Áp dụng **Redis Caching** với chiến lược *Cache-Aside*, giảm 70% tải cho MySQL. |
| **Real-time Countdown** không đồng bộ giữa các tab trình duyệt. | Sử dụng **Redis Pub/Sub** kết hợp **SSE** để push trạng thái từ server xuống client. |
| **LLM Inference** tiêu tốn quá nhiều tài nguyên và chậm. | Implement **Singleton Pattern** và chạy inference qua **Celery Workers**. |

---

## 📦 Cài đặt và Triển khai

### Yêu cầu hệ thống
- Docker & Docker Compose
- Python 3.10+ (nếu chạy local)

### Các bước triển khai (Docker)

1. **Clone dự án:**
   ```bash
   git clone [https://github.com/qan29112004/Hotel-Management.git](https://github.com/qan29112004/Hotel-Management.git)
   cd Hotel-Management
2. **Cấu hình môi trường:**
  Tạo file .env dựa trên env.example:
  
  Đoạn mã
  DEBUG=True
  SECRET_KEY=your_secret_key
  MYSQL_DB=hotel_db
  REDIS_URL=redis://redis:6379/0
  CHATGROQ_API_KEY=your_key_here
  ....
3. **Khởi chạy bằng Docker Compose:**

  ```bash
  docker-compose up --build
