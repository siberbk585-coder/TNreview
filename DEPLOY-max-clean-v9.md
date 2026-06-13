# Deploy Max Clean v9 — TNreview (DQA TaskHub)

## Phạm vi gói

| Bao gồm | Mô tả |
|---------|--------|
| `server.js` | Node HTTP server + proxy `/api/*` + session |
| `index.html` | SPA React phê duyệt (toàn bộ UI chính) |
| `form5-dist/` | Form 5 / C2 / assets tĩnh (`/form5/`, `/assets/`, `/c2/`) |
| `package.json` | `npm start` → `node server.js` |
| `app.cjs` / `app.js` | Entry cPanel / LiteSpeed lsnode (shim → `server.js`) |
| `.htaccess` / `htaccess.txt` | cPanel ghi env; đổi tên `htaccess.txt` nếu không thấy file ẩn |
| `.env.example` | Mẫu biến môi trường (không chứa secret) |

**v9:** Form đăng nhập không pre-fill `admin`; UI báo cáo + entry Node cPanel đầy đủ.

| Loại trừ | Lý do |
|----------|--------|
| `node_modules/` | Không có dependency npm runtime |
| `refs/`, `.cursor/`, `external-skills/` | Tham chiếu / dev |
| `.env`, `.env.local` | Secret |
| Gói deploy cũ `deploy-max-clean-v*` | Tránh trùng |

**Lưu ý:** Khác template mặc định (không có `dist/`, `app.js`, `server/`). Server đọc `index.html` tại **thư mục gốc** gói deploy.

## Yêu cầu server

- **Node.js ≥ 18**
- Cổng mở (mặc định `3000` hoặc `PORT` từ env)
- Process manager: PM2 / systemd / cPanel Node App

## Checklist trước deploy

- [ ] Đã test local: `npm start` → http://localhost:3000
- [ ] `/api/health` trả OK
- [ ] Đăng nhập + một luồng duyệt báo cáo (vd. `linh` / `linh123`)
- [ ] Không copy file `.env` thật vào zip
- [ ] `form5-dist/index.html` tồn tại trong gói

## Các bước release (VPS / cPanel Node)

1. **Upload** `deploy-max-clean-v9.zip` lên server, giải nén vào thư mục app (vd. `~/tnreview`).
2. **STOP** app Node cũ (PM2 stop / cPanel Stop Application).
3. **Cài đặt:** không cần `npm ci` (không dependency). Chỉ cần Node 18+.
4. **Env:** tạo `.env` từ `.env.example` nếu cần đổi `PORT` / mật khẩu / webhook.
5. **START:** `npm start` hoặc `node server.js` (PM2: `pm2 start server.js --name tnreview`).
6. **Reverse proxy** (Nginx): proxy_pass tới `http://127.0.0.1:3000`.

### cPanel + LiteSpeed (bắt buộc — tránh lỗi 404 khi đăng nhập)

Triệu chứng: đăng nhập hiện HTML **404 Not Found — LiteSpeed** (như ảnh), vì **chỉ có file tĩnh** hoặc **Node chưa chạy / chưa gắn domain**.

1. **cPanel → Setup Node.js App** (hoặc *Node.js Selector*).
2. **Create Application:**
   - **Node.js version:** 18 trở lên
   - **Application mode:** Production
   - **Application root:** thư mục chứa `server.js` + `index.html` + `form5-dist` (vd. `tnreview` hoặc `pheduyet`) — **không** chỉ upload mỗi `index.html` lên `public_html` tách rời
   - **Application URL:** `pheduyet.dqa-karofi.io.vn` (đúng subdomain đang dùng)
   - **Application startup file:** `app.js` **hoặc** `server.js` (cùng một app; **không** dùng `app.js` CommonJS cũ có `require('http')`)
3. Bấm **Run NPM Install** (có thể bỏ qua — không dependency), sau đó **START / Restart** app.
4. **Kiểm tra trước khi đăng nhập UI:**

   `http://pheduyet.dqa-karofi.io.vn/api/health`

   Phải thấy: `{"ok":true}` — **không** được là trang HTML 404 LiteSpeed.

5. Nếu vẫn 404:
   - Application root sai (thiếu `server.js`)
   - Domain trỏ `public_html` khác thư mục Node app → chỉnh Application URL / document root theo hướng dẫn host
   - App Node **Stopped** → Start lại, xem log trong cPanel
   - Upload nhầm bản cũ / thiếu `form5-dist` (không gây 404 login nhưng thiếu tính năng)

**Không** deploy kiểu “chỉ đặt `index.html` trong `public_html`” mà không tạo Node app — UI mở được nhưng mọi `/api/*` sẽ 404.

### File `.htaccess` “không thấy” sau khi upload zip

File **có trong zip** nhưng cPanel/FTP **ẩn file bắt đầu bằng dấu chấm** (dotfile).

**Cách 1 — Bật hiện file ẩn:** File Manager → **Settings** (bánh răng) → bật **Show Hidden Files (dotfiles)** → Reload → sẽ thấy `.htaccess`.

**Cách 2 — Đổi tên file trong zip:** Trong thư mục `pheduyet` có **`htaccess.txt`** → Rename thành **`.htaccess`** (dấu chấm ở đầu, không có `.txt`).

**Cách 3 — Tạo tay:** New File → tên `.htaccess` → nội dung một dòng `# tnreview` → Save.

### Lỗi cPanel: `No such file or directory: .../pheduyet/.htaccess`

cPanel ghi biến môi trường vào `.htaccess` trong **Application root**. Lỗi này khi **thư mục chưa tồn tại** hoặc **chưa có file `.htaccess`** (kể cả file ẩn) trước khi lưu Node app.

**Thứ tự đúng:**

1. **File Manager** → `public_html` → tạo thư mục `pheduyet` (nếu chưa có).
2. Upload & **giải nén** `deploy-max-clean-v9.zip` **vào** `public_html/pheduyet/` (phải thấy `server.js`, `index.html`, `form5-dist`, `.htaccess`).
3. **Sau đó** mới vào **Setup Node.js App**:
   - Application root: `/home/dqakaron/public_html/pheduyet`
   - Startup file: `server.js`
   - Application URL: `pheduyet.dqa-karofi.io.vn`
4. Lưu env / Restart — cPanel sẽ cập nhật `.htaccess` (file placeholder trong zip đã có sẵn).

Nếu đã tạo Node app trước khi có thư mục: xóa app Node → làm bước 1–2 → tạo lại app.

### Lỗi: `app.js` — `require is not defined` (ES module)

cPanel đang chạy **`app.js` cũ** (CommonJS `require('http')`) trong khi `package.json` có `"type": "module"`.

**Sửa:**

1. **Xóa** trên server file `app.js` cũ (template hosting / bản deploy khác).
2. Upload **`app.js` mới** từ zip v9 (chỉ có `import './server.js';`) **hoặc** đổi Startup file thành **`server.js`**.
3. **Restart** Node app.

Không trộn bản deploy cũ (có `app.js` require) với `package.json` của TNreview.

### Lỗi: `Cannot find module .../app.cjs` (lsnode / LiteSpeed)

Hosting **bắt buộc** file **`app.cjs`** làm entry (lsnode dùng `require()`).

**Sửa:** Upload **`app.cjs`** từ zip v9 vào `public_html/pheduyet/`, hoặc trong Node.js App đặt **Application startup file** = `app.cjs` (file phải tồn tại).

Nội dung `app.cjs` trong gói chỉ `import('./server.js')` — không cần sửa tay.

Có thể dùng một trong: **`app.cjs`** (LiteSpeed), **`app.js`**, **`server.js`** — chỉ cần **một** file startup khớp cấu hình cPanel.

## Xác minh sau deploy

```bash
curl -sS https://YOUR-DOMAIN/api/health
```

Trình duyệt:

1. Mở `/` → màn đăng nhập
2. Đăng nhập trưởng nhóm → **Báo cáo** → tải danh sách
3. (Tuỳ chọn) `/form5/` hoặc embed Form 5 từ menu trưởng phòng

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Xử lý |
|-------------|-------------|--------|
| **503 / không vào được** | Node app chưa chạy / sai PORT | Kiểm tra PM2 logs, `PORT`, firewall |
| **404 `/api/...`** | Proxy Nginx không forward toàn path | Proxy `location /` tới Node, không chỉ static |
| **404 `/form5/`** | Thiếu thư mục `form5-dist` trong gói | Deploy lại zip đủ `form5-dist/` |
| **Trang trắng `/`** | Thiếu `index.html` cùng cấp `server.js` | Không deploy chỉ `dist/` — dùng layout gói v9 |
| **401 mọi API** | Chưa login / cookie | Gọi `/api/login` hoặc đăng nhập UI trước |
| **Webhook lỗi** | Tino.page down / URL sai | Kiểm tra biến `*_URL` trong `.env` |

## Tạo lại gói zip (local)

```bash
cd "/path/to/TNreview-main"
./scripts/build-deploy-max-clean-v9.sh
```

Hoặc thủ công: copy các file runtime vào `deploy-max-clean-v9/` rồi `zip -r deploy-max-clean-v9.zip deploy-max-clean-v9`.
