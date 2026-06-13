---
name: evilcharts
description: >-
  Charts theo phong cách EvilCharts (Recharts composed/stacked/hatched, dual axis).
  Dùng khi user nhắc evilcharts, biểu đồ dashboard, combo line+bar, hoặc cần tham khảo
  refs/evilcharts trong repo TNreview.
---

# EvilCharts (TNreview)

Tham chiếu: [evilcharts](https://github.com/legions-developer/evilcharts) · [evilcharts.com](https://evilcharts.com)

Repo clone trong dự án: `refs/evilcharts/`

## Bối cảnh TNreview

- App là **React UMD + Babel** trong `index.html` (không Next.js).
- **Không** copy trực tiếp `EvilComposedChart` (cần shadcn, motion, registry).
- **Làm đúng pattern EvilCharts** bằng **Recharts UMD** (`window.Recharts`).

## Pattern chuẩn cho Dashboard TNreview

### Dữ liệu API → chart rows

Mỗi tháng (`Tháng`: `2026-01` … `2026-05`, label `T1`…`T5`):

| Field chart | Nguồn JSON |
|-------------|------------|
| `tasks` | `Số tác vụ` |
| `workHours` | `Số giờ công` (tổng, **đã gồm** tăng ca) |
| `overtime` | `Số giờ tăng ca` (phần trong tổng) |
| `regularHours` | `workHours - overtime` |
| `people` | `Số nhân sự` |

```javascript
function toChartRows(rows) {
  return rows.map(r => {
    const total = Number(r.workHours) || 0;
    const ot = Math.min(Number(r.overtime) || 0, total);
    return {
      ...r,
      tasks: Number(r.tasks) || 0,
      people: Number(r.people) || 0,
      regularHours: Math.max(0, total - ot),
      overtime: ot
    };
  });
}
```

### Biểu đồ chính (giống sketch user)

**ComposedChart** — tham khảo `refs/evilcharts/src/registry/examples/ex-hatched-variant-composed-chart.tsx`:

- `Line` + `yAxisId="tasks"` (trái): số tác vụ
- `Bar` `stackId="hours"` + `yAxisId="hours"` (phải):
  - `regularHours` — fill xanh nhạt
  - `overtime` — fill `url(#otHatch)` (hatched, trong tổng giờ công)
- `CartesianGrid`, `Tooltip`, `Legend`
- `ResponsiveContainer` height ~280px

### Biểu đồ nhân sự (tách riêng)

**BarChart** — một series `people`, màu tím, height ~180px.

## File cần sửa trong TNreview

| File | Việc |
|------|------|
| `index.html` | Script Recharts UMD; `ComboWorkloadChart` / `PeopleHeadcountChart` |
| `normalizeDashboardSummary` | Trả `months[]` đủ 4 metric, sort T1→T5 |

## Tham khảo nhanh trong clone

| Mục đích | Path |
|----------|------|
| Composed + hatched bar | `refs/evilcharts/src/registry/examples/ex-hatched-variant-composed-chart.tsx` |
| Composed base | `refs/evilcharts/src/registry/charts/composed-chart.tsx` |
| Stacked bar | `refs/evilcharts/src/registry/examples/ex-stacked-type-bar-chart.tsx` |

## Checklist trước khi giao

- [ ] Tháng hiển thị T1→T5, sort `monthKey` tăng dần
- [ ] Cột = tổng giờ công; phần gạch = tăng ca **không** cộng thêm ngoài tổng
- [ ] Tooltip/legend tiếng Việt
- [ ] Bảng số chi tiết giữ bên dưới chart (phương án A)
