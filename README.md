# TNreview

Node.js app cho module duyệt báo cáo/phê duyệt form.

## Chạy local

```bash
npm start
```

Mở `http://localhost:3000`.

## Account mặc định

- `admin` / `admin123`
- `truongphong` / `tp123`
- `linh` / `linh123`
- `hieu` / `hieu123`

Mật khẩu có thể override bằng biến môi trường `ADMIN_PASSWORD`, `MANAGER_PASSWORD`, `LINH_PASSWORD`, `HIEU_PASSWORD`.

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
