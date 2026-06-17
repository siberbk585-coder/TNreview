# Port màn **Tổng quan** từ TNreview → Home DQA Portal (port 8787)

Tài liệu này mô tả cách đưa trang **Tổng quan** (nút nav `Tổng quan` → component `Dashboard`) từ **TNreview** sang **Home DQA** (`deploy-max-clean-v9`, chạy local `http://localhost:8787`).

> Bạn copy file này sang repo Home DQA và làm theo từng bước.

---

## 1. Hai dự án đang nói tới

| | **Nguồn (TNreview)** | **Đích (Home DQA)** |
|---|---|---|
| Thư mục | `Pheduyet/TNreview-main` | `Home DQA/deploy-max-clean-v9` |
| Local | `http://localhost:3000` | `http://localhost:8787` |
| Frontend | 1 file `index.html` (React Babel CDN) | `src/` — React 18 + Vite + TypeScript |
| Routing | `page` state trong `Layout` | `view` string trong `PortalContext` |
| Nav **Tổng quan** | `Layout` → `page === 'dashboard'` | **Chưa có** — chỉ có **Trang chủ** (`home`) |

---

## 2. Màn Tổng quan gồm gì?

### UI chính (`Dashboard` trong TNreview)

1. **Hero** — tháng hiện tại, số tác vụ, delta so với tháng trước, hiệu suất/người, đỉnh chuỗi  
2. **Dashboard DQA** — biểu đồ combo (tác vụ + giờ công) + bảng tổng hợp theo tháng  
3. **Dashboard SPM 2026** — panel tóm tắt KRD/DQA + donut FMEA/lỗi + nút **Mở dashboard đầy đủ** → Form 10  

### API cần có

| Endpoint | Mục đích | Webhook mặc định (TNreview) |
|----------|----------|------------------------------|
| `GET /api/dashboard` | Chuỗi tháng: tác vụ, giờ công, nhân sự, tăng ca | `https://iatzhxxuk.tino.page/webhook/Dashboardtonghop` |
| `GET /api/form10/spm-data` | Tóm tắt SPM (KRD, DQA, FMEA, lỗi) | `https://iatzhxxuk.tino.page/webhook/cong2form10` |

**Query params** khi gọi dashboard (TNreview):

```
reviewer, role, team, group, _ts
```

Home DQA hiện **chưa có** 2 route trên trong `server/server.mjs`.  
Đã có sẵn: `/api/ng-jira/dashboard`, `/api/form4/dashboard`, `openView('c2form10')` cho SPM đầy đủ.

### Mẫu response `/api/dashboard`

```json
[
  {
    "Tháng": "2026-06",
    "Số tác vụ": "89",
    "Số giờ công": "1138",
    "Số nhân sự": "13",
    "Số giờ tăng ca": "26"
  },
  { "Tháng": "2026-05", "Số tác vụ": "156", ... }
]
```

---

## 3. Nguồn code cần copy (TNreview `index.html`)

| Khối | Hàm / component | Dòng tham khảo (ước lượng) |
|------|------------------|----------------------------|
| Utils | `deepRows`, `get`, `lowerMap`, `toNumber`, `firstNumber`, `norm` | ~304–340 |
| Chuẩn hóa tháng | `fillDashboardMonths` | ~568–591 |
| Chuẩn hóa dashboard | `normalizeDashboardSummary` | ~482–525 |
| Chuẩn hóa SPM | `normalizeSpmOverview`, `boolMark` | ~526–562 |
| Trang chính | `Dashboard` | ~941–1026 |
| Panel SPM | `SpmOverviewPanel` | ~1027–1085 |
| Biểu đồ | `TrendChart`, `ComboWorkloadChart`, `WorkHoursChart`, `OvertimeChart`, `PeopleHeadcountChart` | ~1182–1480 |
| SVG fallback | `ComboWorkloadChartSvg`, `WorkHoursChartSvg`, … | ~1211+ |
| Tooltip | `DashboardTooltip` | ~266–279 |
| CSS | `.story-hero`, `.overview-grid`, `.insight-card`, `.donut-*`, `.spm-mini-*` | ~140–160 |

**Không port** (không thuộc Tổng quan hoặc không nên public):

- Khối tài khoản mặc định `admin/admin123` trong `Dashboard` (dòng ~1015–1024) — **bỏ hẳn** khi port  
- Login, phê duyệt, QuickApproval, TaskBoard, …

---

## 4. Bước A — Backend (`server/server.mjs`)

Thêm biến môi trường (đầu file, cạnh các `*_URL` khác):

```javascript
const DASHBOARD_SUMMARY_URL =
  process.env.DASHBOARD_SUMMARY_URL ||
  'https://iatzhxxuk.tino.page/webhook/Dashboardtonghop';

const FORM10_SPM_URL =
  process.env.FORM10_SPM_URL ||
  'https://iatzhxxuk.tino.page/webhook/cong2form10';
```

Thêm route (theo pattern proxy sẵn có, ví dụ `FORM4_DASHBOARD`):

```javascript
app.get('/api/dashboard', async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query);
    qs.set('_ts', String(Date.now()));
    const url = `${DASHBOARD_SUMMARY_URL}?${qs.toString()}`;
    const { ok, status, text, parsed } = await fetchJsonOrText(url);
    if (!ok) {
      return res.status(status || 502).json({ ok: false, error: text || `HTTP ${status}` });
    }
    return res.json(parsed ?? text);
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

app.get('/api/form10/spm-data', async (req, res) => {
  try {
    const url = `${FORM10_SPM_URL}?_ts=${Date.now()}`;
    const { ok, status, text, parsed } = await fetchJsonOrText(url);
    if (!ok) {
      return res.status(status || 502).json({ ok: false, error: text || `HTTP ${status}` });
    }
    return res.json(parsed ?? text);
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});
```

**Kiểm tra:**

```bash
curl -s "http://localhost:8787/api/dashboard?_ts=1" | head -c 400
curl -s "http://localhost:8787/api/form10/spm-data?_ts=1" | head -c 400
```

Tham khảo đầy đủ: `TNreview-main/server.js` (khoảng dòng 14–15, 535–543).

---

## 5. Bước B — Cấu trúc frontend đề xuất (Home DQA `src/`)

```
src/features/overview/
  dashboardNormalize.ts    # deepRows, get, normalizeDashboardSummary, normalizeSpmOverview, fillDashboardMonths
  OverviewDashboard.tsx    # port từ Dashboard()
  SpmOverviewPanel.tsx     # port từ SpmOverviewPanel()
  TrendChart.tsx           # + các chart con hoặc tách file riêng
  charts/
    ComboWorkloadChart.tsx
    ComboWorkloadChartSvg.tsx   # fallback nếu không dùng recharts
  overview.css               # hoặc gộp vào index.css — class story-hero, overview-grid, ...
```

### Dependency biểu đồ

TNreview load Recharts từ CDN. Trên Home DQA nên:

```bash
npm install recharts
```

Hoặc **chỉ dùng SVG fallback** (`ComboWorkloadChartSvg`, …) — không cần thêm package, chart đơn giản hơn.

### Gọi API (TypeScript)

```typescript
// src/features/overview/api.ts
export async function fetchDashboardSummary(params: {
  reviewer?: string;
  role?: string;
  team?: string;
  group?: string;
}) {
  const qs = new URLSearchParams({
    reviewer: params.reviewer ?? '',
    role: params.role ?? '',
    team: params.team ?? '',
    group: params.group ?? 'all',
    _ts: String(Date.now()),
  });
  const r = await fetch(`/api/dashboard?${qs}`);
  if (!r.ok) throw new Error(`Dashboard HTTP ${r.status}`);
  return r.json();
}

export async function fetchSpmOverview() {
  const r = await fetch(`/api/form10/spm-data?_ts=${Date.now()}`);
  if (!r.ok) throw new Error(`SPM HTTP ${r.status}`);
  return r.json();
}
```

### User context

TNreview truyền `user.username`, `user.role`, `user.team`, `groupForUser(user)`.

Home DQA chỉ có `loggedInUser` (input header). **Tối thiểu khi port:**

```typescript
reviewer: loggedInUser,
role: '',
team: '',
group: 'all',
```

Sau này có thể mở rộng `PortalContext` nếu cần lọc theo nhóm.

### Nút «Mở dashboard đầy đủ»

Trong TNreview: `onNavigate(SPM_DASHBOARD.pageId)` → `hr-c2form10`.

Trong Home DQA: dùng sẵn:

```typescript
const { openView } = usePortal();
// ...
onOpenFull={() => openView('c2form10')}
```

`c2form10` đã map trong `ViewRouter` → `Cong2FormPage` (iframe Cong-2 Form 10).

---

## 6. Bước C — Gắn menu **Tổng quan**

### 1. `src/app/tiles.ts`

Thêm vào `VIEW_TITLES`:

```typescript
overview: 'Tổng quan',
```

(Tùy chọn) Thêm section riêng hoặc tile đầu tiên — không bắt buộc nếu chỉ dùng nút sidebar.

### 2. `src/app/AppLayout.tsx`

Thêm nút **Tổng quan** ngay dưới **Trang chủ** (mirror TNreview nav):

```tsx
<button
  type="button"
  onClick={() => openView('overview')}
  className={`mb-3 w-full rounded-lg px-3 py-2 text-left ${
    view === 'overview' ? 'bg-blue-50 font-semibold text-blue-800' : 'hover:bg-slate-50'
  }`}
>
  Tổng quan
</button>
```

### 3. `src/app/views/ViewRouter.tsx`

```tsx
import OverviewDashboard from '@/features/overview/OverviewDashboard';

// ...
if (view === 'overview') return <OverviewDashboard />;
```

Đặt **trước** `if (view === 'home')` hoặc ngay sau — không quan trọng.

---

## 7. Bước D — CSS cần port

Copy từ `TNreview-main/index.html` (khoảng dòng 140–160) sang `src/features/overview/overview.css` hoặc `src/index.css`:

- `.story-hero`, `.story-kicker`
- `.insight-card`
- `.overview-grid` (+ media query `@max-width:1100px`)
- `.spm-mini-grid`, `.spm-mini-card`
- `.donut-grid`, `.donut-card`, `.donut-svg`, `.donut-title`, `.donut-value`, `.donut-note`

TNreview còn dùng class chung `.card`, `.pill`, `.data-table`, `.table-wrap` — Home DQA có Tailwind; có thể:

- map sang utility Tailwind tương đương, hoặc  
- copy thêm các class `.card` từ TNreview nếu muốn giữ pixel-perfect.

---

## 8. Logic tháng (quan trọng)

`normalizeDashboardSummary` + `fillDashboardMonths`:

- Lọc theo **năm hiện tại**
- **Không** giới hạn T1–T5 (đã sửa trong TNreview v11)
- Tự **bù tháng thiếu** (giá trị 0) từ T1 → tháng hiện tại

Khi port, copy nguyên `fillDashboardMonths` — tránh hard-code `m <= 5`.

---

## 9. Chạy thử local

**Terminal 1 — API (bắt buộc):**

```bash
cd "Home DQA/deploy-max-clean-v9"
npm start
# → http://localhost:8787
```

**Terminal 2 — UI dev (nếu sửa `src/`):**

```bash
cd "Home DQA/deploy-max-clean-v9"
npx vite
# proxy /api → 8787 (đã cấu hình vite.config.ts)
```

**Checklist:**

- [ ] Sidebar có **Tổng quan**
- [ ] Biểu đồ hiện đủ T1…T(tháng hiện tại)
- [ ] Panel SPM có số liệu (hoặc loading/empty rõ ràng)
- [ ] **Mở dashboard đầy đủ** → Form 10 (`c2form10`)
- [ ] Không còn block hiển thị mật khẩu demo

---

## 10. Cách nhanh (không port code) — iframe

Nếu chỉ cần xem tạm, thêm view iframe trỏ TNreview:

```tsx
// OverviewIframe.tsx
export default function OverviewIframe() {
  return (
    <iframe
      className="h-[calc(100dvh-8rem)] w-full rounded-xl border border-slate-200"
      src="http://localhost:3000"  // prod: URL TNreview cùng domain
      title="Tổng quan TNreview"
    />
  );
}
```

**Hạn chế:** 2 app, 2 session đăng nhập, CORS/cookie phức tạp trên production.

---

## 11. Build / deploy Home DQA sau khi port

Home DQA v9 hiện ship `dist/` + bundle legacy (`index-CHVuYQMq.js`). Sau khi sửa `src/`:

1. `npm run build` hoặc quy trình build nội bộ của team  
2. Cập nhật `dist/` theo pipeline hiện tại (`pre-deploy-verify.mjs`, v.v.)  
3. Restart server `:8787`

TNreview **không** cần deploy lại nếu chỉ port sang Home DQA.

---

## 12. File tham chiếu nhanh

| File TNreview | File Home DQA (đích) |
|-------------|----------------------|
| `index.html` → `Dashboard` | `src/features/overview/OverviewDashboard.tsx` |
| `index.html` → normalize* | `src/features/overview/dashboardNormalize.ts` |
| `server.js` → `/api/dashboard` | `server/server.mjs` |
| `Layout` nav `Tổng quan` | `src/app/AppLayout.tsx` + `ViewRouter.tsx` |
| `SPM_DASHBOARD` → `c2form10` | `openView('c2form10')` (đã có) |

---

## 13. Thứ tự làm gợi ý

1. Backend: thêm 2 route API → `curl` OK  
2. `dashboardNormalize.ts` — test bằng unit hoặc `console.log` với JSON mẫu  
3. `OverviewDashboard.tsx` + `SpmOverviewPanel.tsx` — UI tĩnh  
4. `TrendChart` + Recharts hoặc SVG  
5. Gắn `overview` vào nav + `ViewRouter`  
6. CSS polish  
7. Test E2E trên `:8787`

---

*Tài liệu tạo từ TNreview `deploy-max-clean-v11` — cập nhật khi đổi webhook hoặc cấu trúc Home DQA.*
