# Web Portal Front-End

Một ứng dụng web Angular hiện đại được thiết kế như một **cổng thông tin web** tập trung để truy cập nhiều tính năng và dịch vụ khác nhau.

## 🛠️ Tech Stack

-   **Frontend**: Angular 17+
-   **UI**: Angular Material / TailwindCSS
-   **Routing**: Angular Router
-   **State Management**: (Optional) NgRx / Services
-   **Others**: RxJS(Reactive Programming), SCSS,Fuse(Admin Template UI Angular),

## 🧰 Các Phần Mềm Cần Chuẩn Bị Cho Dự Án Angular

1. Node.js (v14+)
    - 👉 Angular sử dụng Node.js để chạy các lệnh CLI, build, cài package.
    - ✅ Gồm cả npm – trình quản lý package.
    - 📥 Tải tại: https://nodejs.org/
2. Angular CLI
    - 👉 Công cụ dòng lệnh để tạo, chạy, và quản lý dự án Angular.
    - 📦 Cài đặt:
    - ```bash
         npm install -g @angular/cli
      ```
3. Trình Soạn Thảo Mã Nguồn (IDE/Editor)
    - ✅ Visual Studio Code (khuyên dùng)
    - 🔌 Cài thêm các extensions hữu ích:
        - Angular Language Service
        - ESLint
        - Prettier
        - Tailwind CSS IntelliSense (nếu dùng Tailwind)

-   📥 VSCode: https://code.visualstudio.com/
-

## 📦 Thiết lập dự án

### 1. Clone Repository

```bash
git clone https://github.com/tranvandiep/fdi-portal.git
cd fe
```

### 2. Install Dependencies

```bash
npm install

```

### 3. Khởi động dự án

1. Môi trường phát triển(**Developer**)

```bash
    npm run start
```

Visit: http://localhost:4200

2. Môi trường trung gian(**Staging**)

```bash
    npm run startStg
```

Visit: http://113.20.107.237:8001

1. Môi trường sản xuất(**Production**)

```bash
    npm run startProd
```

Visit: http://113.20.107.237:8001

4. Test

```bash
    npm run test
```

5. Build

```bash
    npm run build
```

Đầu ra sẽ nằm trong thư mục dist/

## 4. Cấu trúc thư mục

```
fe/
├── .angular/
├── configs/
├── node_modules/
├── src/
|     ├── @fuse/ # Fuse Angular Admin Template
|     ├── app/
|           ├── core/ # Chứa các service được dùng cho dự án
|           ├── layout/ # layout chung cho các page
|           ├── mock-api/ # API mẫu
|           ├── modules/ # Page site
|           ├── shared/ # component dùng chung cho dự án
|           ├── app.component.html
|           ├── app.component.scss
|           ├── app.component.ts
|           ├── app.config.ts
|           ├── app.resolvers.ts # TẢI DỮ LIỆU BAN ĐẦU TRƯỚC KHI HIỂN THỊ GIAO DIỆN
|           └── app.routes.ts
|     ├── assets/ # Chứa file tĩnh như hình ảnh, icon, font, i18n,...
|     ├── environments/ # Cấu hình biến môi trường (Dev,Stag, Prod)
|     ├── styles/ # File css, scss global
|     ├── index.html
|     └── main.ts
├── .editorconfig # Cấu hình chuẩn định mã nguồn
├── .eslintrc.json
├── .gitignore
├── .npmrc # Cấu hình hành vi của npm
├── .nvmrc # cấu hình dành cho NVM (Node Version Manager)
├── angular.json # cấu hình trung tâm của Angular CLI
├── bash.exe.stackdump # lưu lại danh sách các hàm đã được gọi dẫn đến lỗi
├── CREDITS
├── LICENSE.md
├── package.json
├── readme.md
├── tailwind.config.js # Cấu hình tailwindcss
├── transloco.config.js # Cấu hình transloco(Thư viện i18n, quốc tế hóa đa ngôn ngữ)
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

## Angular Style Guide Checklist

### 1. Cấu trúc dự án (Project Structure)

-   [ ] Tổ chức theo tính năng (feature-based), không theo loại file chung.
-   [ ] Mỗi feature có thư mục riêng chứa component, service, module liên quan.
-   [ ] Tách rõ `app`, `shared`, `core` modules.

### 2. Quy tắc đặt tên (Naming Conventions)

-   [ ] File đặt theo kiểu `feature.type.ts` (ví dụ: `user.service.ts`).
-   [ ] Class, interface đặt tên PascalCase (ví dụ: `UserService`).
-   [ ] Biến, hàm đặt camelCase (`getUser()`).
-   [ ] Tên rõ ràng, tránh viết tắt không cần thiết.
-   [ ] Tên biến private nên có prefix **\_**
-   [ ] Tên biến Rxjs nên có suffix **$**

### 3. Component Design

-   [ ] Mỗi component làm một việc rõ ràng (Single Responsibility Principle).
-   [ ] Giữ component nhỏ, không quá tải logic.
-   [ ] Giao tiếp cha-con qua Input/Output.
-   [ ] Tránh service gọi trực tiếp trong template.

### 4. Service Design

-   [ ] Service dùng để xử lý nghiệp vụ, gọi API.
-   [ ] Service singleton hoặc scope module rõ ràng (`providedIn: 'root'`).
-   [ ] Tách biệt logic xử lý với UI.

### 5. Change Detection & Performance

-   [ ] Sử dụng `ChangeDetectionStrategy.OnPush` khi có thể.
-   [ ] Dùng `async` pipe để subscribe Observable tự động.
-   [ ] Hủy subscription đúng cách để tránh leak.

### 6. Xử lý lỗi (Error Handling)

-   [ ] Bắt lỗi ở service và component.
-   [ ] Có xử lý lỗi global (`ErrorHandler`).
-   [ ] Hiển thị thông báo lỗi thân thiện người dùng.

### 7. Testing

-   [ ] Viết unit test cho component, service, pipe, directive.
-   [ ] Sử dụng TestBed và mock dependencies.
-   [ ] Có e2e test nếu có thể.

### 8. Security

-   [ ] Tránh XSS, dùng Angular sanitizer.
-   [ ] Kiểm soát truy cập API và route.
-   [ ] Dùng Guard và Interceptor bảo vệ route và token.

### 9. Internationalization (i18n)

-   [ ] Tách chuỗi văn bản ra file resource.
-   [ ] Dùng thư viện như Transloco hoặc ngx-translate.

### 10. Linting & Formatting

-   [ ] Cấu hình ESLint hoặc TSLint.
-   [ ] Dùng Prettier tự động format code.
-   [ ] Thực thi quy tắc lint trong CI/CD pipeline.

### 11. Documentation

-   [ ] Comment rõ ràng cho API, component quan trọng.
-   [ ] Có README hoặc Wiki hướng dẫn cấu trúc và quy tắc dự án.
-   [ ] Ghi chú các quyết định kiến trúc đặc biệt.

### 12. Bootstrapping

-   [ ] Đặt logic bootstrapping trong `main.ts`.
-   [ ] Thêm xử lý lỗi trong bootstrapping.
-   [ ] Không đặt logic nghiệp vụ trong `main.ts`.

### 13. Ưu tiên sử dụng hàm `inject()` thay vì inject qua constructor

-   `inject()` hoạt động tương tự như constructor parameter injection, nhưng có nhiều ưu điểm:
    -   Dễ đọc hơn, đặc biệt khi class có nhiều dependencies.
    -   Dễ dàng thêm comment cho từng dependency được inject.
    -   Hỗ trợ type inference tốt hơn.
    -   Khi target ES2022+ với `useDefineForClassFields`, có thể tránh việc tách khai báo và khởi tạo trường.
-   Có thể refactor code hiện tại sang dùng `inject()` bằng công cụ tự động.
