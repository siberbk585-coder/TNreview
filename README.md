# TNreview

Node.js app cho module duyệt báo cáo/phê duyệt form.

## Chạy local

```bash
npm start
```

Mở `http://localhost:3000`.

## Tài khoản đăng nhập

Tài khoản mẫu: `admin`, `truongphong`, `linh`, `hieu` (xem `server.js` để biết vai trò).

**Không ghi mật khẩu trong README.** Trên môi trường thật, đặt mật khẩu qua biến môi trường trong `.env`:

- `ADMIN_PASSWORD`
- `MANAGER_PASSWORD`
- `LINH_PASSWORD`
- `HIEU_PASSWORD`

Tham khảo mẫu trong `.env.example`. Nếu không set biến env, server dùng mật khẩu mặc định chỉ phù hợp cho dev local — **đổi ngay trước khi deploy**.

## Endpoint nội bộ

- `GET /api/health`
- `GET/POST /api/reports`
- `POST /api/report-action`
- `GET /api/detail`
- `GET /api/pdforms`
- `GET/POST /api/pdform-action`
- `GET/POST /api/tp/*`

Các endpoint trên proxy tới webhook hiện tại. Frontend là React SPA; khối trưởng phòng được render bằng component React và chỉ hiện với `Admin` hoặc `Trưởng phòng`.

Có thể override URL webhook bằng biến môi trường:

- `REPORTS_QUERY_URL`
- `APPROVE_URL`
- `WEBHOOK_DETAIL`
- `PDFORM_QUERY_URL`
- `PDFORM_ACTION_URL`
- `TP_REPORTS_QUERY_URL`
- `TP_FORM_ACTION_URL`
- `TP_NCTN_REPORTS_QUERY_URL`
- `TP_NCTN_FORM_ACTION_URL`
- `TP_NCTN_HISTORY_URL`
- `TP_PDFORM_QUERY_URL`
- `TP_PDFORM_ACTION_URL`
