/**
 * Form 10 — Dashboard KRD & DQA (layout mới theo sketch).
 * Dữ liệu: GET https://iatzhxxuk.tino.page/webhook/cong2form10
 */
(function () {
  const P = 'f10-spm-';
  const $ = (id) => document.getElementById(P + id);
  const F10SPM_WEBHOOK_URL = (typeof location !== 'undefined' && /^https?:/.test(location.origin))
    ? `${location.origin}/api/form10/spm-data`
    : 'https://iatzhxxuk.tino.page/webhook/cong2form10';
  let F10SPM_ALL = [];

  function pick(row, ...keys) {
    if (!row) return undefined;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k in row && row[k] != null && row[k] !== '') return row[k];
    }
    return undefined;
  }

  function isMarkOn(v) {
    if (v === true || v === 1) return true;
    const s = String(v == null ? '' : v).trim().toLowerCase();
    return s === 'x' || s === '1' || s === 'yes' || s === 'có';
  }

  /** Link Jira dạng [🔗|https://...] hoặc URL thuần */
  function parseJiraUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const t = raw.trim();
    const m = t.match(/\[[^\]|]*\|\s*(https?:\/\/[^\]]+)\]/i);
    if (m) return m[1].trim();
    if (/^https?:\/\//i.test(t)) return t;
    return '';
  }

  function parseAnyUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const t = raw.trim();
    const m = t.match(/\[[^\]|]*\|\s*(https?:\/\/[^\]]+)\]/i);
    if (m) return m[1].trim();
    if (/^https?:\/\//i.test(t)) return t;
    return '';
  }

  function normText(v) {
    return String(v == null ? '' : v).trim().toLowerCase();
  }

  function isTruthyMark(v) {
    const s = normText(v);
    return s === 'x' || s === '1' || s === 'yes' || s === 'true' || s === 'có' || s === 'co';
  }

  function isOkMark(v) {
    const s = normText(v);
    return s === 'ok' || s === 'x' || s === '1' || s === 'yes' || s === 'true';
  }

  function isNgMark(v) {
    const s = normText(v);
    return s === 'ng' || s === 'x' || s === '1' || s === 'yes' || s === 'true';
  }

  function isDoingMark(v) {
    const s = normText(v);
    return s === 'doing' || s === 'đang đánh giá' || s === 'dang danh gia' || s === 'x' || s === '1';
  }

  function buildFmeaDisplay(row) {
    const pct = pick(row, 'Tỉ lệ rà soát FMEA +bổ sung FMEA', 'Tỉ lệ rà soát FMEA + bổ sung FMEA');
    if (pct != null && String(pct).trim() !== '') return String(pct).trim();
    const hm = pick(row, 'Hạng mục FMEA rà soát bổ sung');
    const tot = pick(row, 'Tổng hạng mục rà soát FMEA');
    if (hm != null && tot != null && String(tot).trim() !== '') return `${hm}/${tot}`;
    const tl = pick(row, 'Tỷ lệ đã cải tiến trên tổng lỗi');
    if (tl != null && String(tl).trim() !== '') return String(tl).trim();
    return '';
  }

  function escHtml(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Chuẩn hóa một dòng webhook → model nội bộ (ma, ten, krd, dqa, …) */
  function mapWebhookRowToInternal(row) {
    const soLuongCaiTien = String(pick(row, 'Số lượng  cải tiến lỗi đánh giá LK + SP', 'Số lượng cải tiến lỗi đánh giá LK + SP') ?? '').trim();
    const tongLoi = String(pick(row, 'Tổng lỗi') ?? '').trim();
    const tiLeCaiTien = String(pick(row, 'Tỷ lệ đã cải tiến trên tổng lỗi') ?? '').trim();
    const hmFmea = String(pick(row, 'Hạng mục FMEA rà soát bổ sung') ?? '').trim();
    const tongHmFmea = String(pick(row, 'Tổng hạng mục rà soát FMEA') ?? '').trim();
    const ghiChu = String(pick(row, 'Ghi chú') ?? '').trim();
    const createdAt = String(pick(row, 'CreatedAt') ?? '').trim();
    const updatedAt = String(pick(row, 'UpdatedAt') ?? '').trim();
    const id = String(pick(row, 'Id') ?? '').trim();
    const ma = String(pick(row, 'Mã dự án', 'ma', 'Ma') ?? '').trim();
    const ten = String(pick(row, 'Tên dự án', 'ten') ?? '').trim();
    const cap = String(pick(row, 'Cấp độ', 'Cấp', 'cap') ?? '').trim();
    const pm = String(pick(row, 'PM', 'pm') ?? '').trim();
    const tt = String(pick(row, 'Tình trạng dự án', 'Tình trạng', 'tt') ?? '').trim();
    const pic = String(pick(row, 'PIC DQA', 'PIC') ?? '').trim();
    const krdRaw = pick(row, 'KRD đang triển khai', 'KRD', 'krd');
    const dqaRaw = pick(row, 'DQA đang triển khai', 'DQA', 'dqa');
    const krd = isMarkOn(krdRaw) || isTruthyMark(krdRaw) ? 1 : 0;
    const dqa = isMarkOn(dqaRaw) || isTruthyMark(dqaRaw) ? 1 : 0;
    const ph = String(pick(row, 'Giai đoạn nhận mẫu', 'ph') ?? '').trim();
    const okRaw = pick(
      row,
      'KQ ĐG OK',
      'KQDG OK',
      'KQ OK',
      'Kết quả OK',
      'Ket qua OK',
      'OK',
      'ok'
    );
    const ngRaw = pick(
      row,
      'KQ ĐG NG',
      'KQDG NG',
      'KQ NG',
      'Kết quả NG',
      'Ket qua NG',
      'NG',
      'ng'
    );
    const ddRaw = pick(
      row,
      'Đang đánh giá',
      'Dang danh gia',
      'Đánh giá',
      'Danh gia',
      'Tiến độ',
      'Tien do',
      'dd'
    );
    const statusRaw = pick(
      row,
      'Trạng thái đánh giá',
      'Trang thai danh gia',
      'Review status',
      'Status'
    );
    const statusNorm = normText(statusRaw);
    const ok = isOkMark(okRaw) || statusNorm === 'ok' ? 'OK' : '';
    const ng = isNgMark(ngRaw) || statusNorm === 'ng' ? 'NG' : '';
    const dd = isDoingMark(ddRaw) || statusNorm === 'doing' ? 'Doing' : '';
    const jira = parseJiraUrl(String(pick(row, 'Link Jira', 'link jira', 'jira') ?? ''));
    const linkFmea = parseAnyUrl(String(pick(row, 'Link kết quả FMEA') ?? ''));
    const linkCaiTien = parseAnyUrl(String(pick(row, 'Link kết quả cải tiến lỗi') ?? ''));
    const fmea = buildFmeaDisplay(row);
    const fmeaPercentRaw = String(
      pick(row, 'Tỉ lệ rà soát FMEA +bổ sung FMEA', 'Tỉ lệ rà soát FMEA + bổ sung FMEA') ?? ''
    ).trim();
    return {
      id,
      createdAt,
      updatedAt,
      ma,
      ten,
      cap,
      pm,
      tt,
      pic,
      krd,
      dqa,
      ph,
      ok,
      ng,
      dd,
      soLuongCaiTien,
      tongLoi,
      tiLeCaiTien,
      hmFmea,
      tongHmFmea,
      fmea,
      fmeaPercentRaw,
      jira,
      linkFmea,
      linkCaiTien,
      ghiChu
    };
  }

  async function fetchForm10SpmData() {
    const resp = await fetch(F10SPM_WEBHOOK_URL, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    let body;
    const text = await resp.text();
    try {
      body = JSON.parse(text);
    } catch (_) {
      throw new Error('Phản hồi không phải JSON hợp lệ');
    }
    let rows = body;
    if (!Array.isArray(rows) && body && typeof body === 'object') {
      if (Array.isArray(body.data)) rows = body.data;
      else if (Array.isArray(body.results)) rows = body.results;
      else if (body.data && Array.isArray(body.data.results)) rows = body.data.results;
    }
    if (!Array.isArray(rows)) throw new Error('Dữ liệu không phải mảng');
    return rows.map(mapWebhookRowToInternal).filter((r) => r && r.ma);
  }

  function isKrdActive(project) {
    const status = String(project?.tt || '').trim().toLowerCase();
    if (!status) return true;
    return !['done', 'canceled', 'cancelled'].includes(status);
  }

  function computeKrdStats(krdAll) {
    const krd = krdAll.filter(isKrdActive);
    const total = krd.length;
    const l1 = krd.filter((p) => p.cap === 'L1').length;
    const l2 = krd.filter((p) => p.cap === 'L2').length;
    const l3 = krd.filter((p) => p.cap === 'L3').length;
    return { total, l1, l2, l3 };
  }

  function computeDqaStats(dqa) {
    const total = dqa.length;
    const doing = dqa.filter((p) => p.dd === 'Doing').length;
    const ng = dqa.filter((p) => p.ng === 'NG').length;
    const ok = dqa.filter((p) => p.ok === 'OK').length;
    const ngRate = total > 0 ? Math.round((ng / total) * 100) : 0;
    return { total, doing, ng, ok, ngRate };
  }

  function hasComputedPercent(raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (!s) return false;
    if (s.includes('%')) return true;
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n);
  }

  function parseNumberSafe(v) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return 0;
    const n = Number(s.replace(',', '.').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function computeFmeaStats(dqa) {
    const total = dqa.length;
    let computedPercent = 0;
    let notNeeded = 0;
    let dqaDone = 0;
    let othersDone = 0;
    dqa.forEach((p) => {
      const hmFmeaText = String(p.hmFmea || '').trim().toLowerCase();
      const isNotNeeded = hmFmeaText === 'không cần' || hmFmeaText === 'khong can';
      if (isNotNeeded) {
        notNeeded += 1;
      } else if (hasComputedPercent(p.fmeaPercentRaw)) {
        computedPercent += 1;
      }
      const reviewedHm = Math.max(0, parseNumberSafe(p.hmFmea));
      const totalHm = Math.max(0, parseNumberSafe(p.tongHmFmea));
      dqaDone += reviewedHm;
      othersDone += Math.max(0, totalHm - reviewedHm);
    });
    const notComputedPercent = Math.max(0, total - computedPercent - notNeeded);
    return {
      reviewed: computedPercent,
      notUpdated: notComputedPercent,
      notNeeded,
      dqaDone,
      othersDone
    };
  }

  function computeLevelPhaseStats(dqa) {
    const initRow = () => ({ total: 0, ok: 0, ng: 0, doing: 0 });
    const level = { L1: initRow(), L2: initRow(), L3: initRow() };
    const phase = { S0: initRow(), S3: initRow(), T0: initRow() };
    const statusOf = (p) => {
      if (String(p.dd || '').trim().toLowerCase() === 'doing') return 'doing';
      if (String(p.ng || '').trim().toUpperCase() === 'NG') return 'ng';
      if (String(p.ok || '').trim().toUpperCase() === 'OK') return 'ok';
      return 'doing';
    };
    dqa.forEach((p) => {
      const lv = String(p.cap || '').trim().toUpperCase();
      const ph = String(p.ph || '').trim().toUpperCase();
      const st = statusOf(p);
      if (lv in level) {
        level[lv].total += 1;
        level[lv][st] += 1;
      }
      if (ph in phase) {
        phase[ph].total += 1;
        phase[ph][st] += 1;
      }
    });
    const withPct = (row) => {
      const t = row.total;
      const pct = (n) => (t > 0 ? Math.round((n / t) * 100) : 0);
      return {
        ...row,
        okPct: pct(row.ok),
        ngPct: pct(row.ng),
        doingPct: pct(row.doing)
      };
    };
    Object.keys(level).forEach((k) => { level[k] = withPct(level[k]); });
    Object.keys(phase).forEach((k) => { phase[k] = withPct(phase[k]); });
    return {
      level,
      phase
    };
  }

  function buildDetectSeries(dqa) {
    const sorted = [...dqa].sort((a, b) => {
      const da = Date.parse(a.updatedAt || a.createdAt || '') || 0;
      const db = Date.parse(b.updatedAt || b.createdAt || '') || 0;
      return da - db;
    });
    let detected = 0;
    let fixed = 0;
    const labels = [];
    const detectedData = [];
    const fixedData = [];
    sorted.forEach((p, idx) => {
      // "Phát hiện" lấy từ trường "Tổng lỗi"
      // "Đã khắc phục" lấy từ trường "Số lượng cải tiến lỗi đánh giá LK + SP"
      const detectedCount = Math.max(0, parseNumberSafe(p.tongLoi));
      const fixedCount = Math.max(0, parseNumberSafe(p.soLuongCaiTien));
      detected += detectedCount;
      fixed += fixedCount;
      labels.push(`DA ${idx + 1}`);
      detectedData.push(detected);
      fixedData.push(fixed);
    });
    return { labels, detectedData, fixedData };
  }

  function destroyCharts() {
    ['chart-dqa-donut', 'chart-detect-line', 'chart-fmea-rate', 'chart-fmea-total'].forEach((id) => {
      const canvas = $(id);
      if (canvas && canvas._f10SpmChart) {
        try {
          canvas._f10SpmChart.destroy();
        } catch (_) {}
        canvas._f10SpmChart = null;
      }
    });
  }

  function syncHeaderTags(allLen, dqaLen) {
    const now = new Date();
    const monthLabel = 'Tháng ' + (now.getMonth() + 1) + ' · ' + now.getFullYear();
    const elM = $('hdr-month');
    if (elM) elM.textContent = monthLabel;
    const sub = document.querySelector('#form10 .f10-spm-root .hdr-sub');
    if (sub) sub.textContent = `Dashboard KRD & DQA · Tổng ${allLen} dự án · DQA ${dqaLen} dự án`;
  }

  function syncKrdKpis(stats) {
    const set = (id, val) => {
      const n = $(id);
      if (n) n.textContent = String(val);
    };
    set('kpi-krd-total', stats.total);
    set('kpi-krd-l1', stats.l1);
    set('kpi-krd-l2', stats.l2);
    set('kpi-krd-l3', stats.l3);
  }

  function syncDqaKpis(s, fmea, breakdown) {
    const set = (id, val) => {
      const n = $(id);
      if (n) n.textContent = String(val);
    };
    const setBar = (id, pct) => {
      const n = $(id);
      if (n) n.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    };
    const syncStackRow = (prefix, row) => {
      set(`${prefix}-total`, `${row.total} DA`);
      set(`${prefix}-mix`, `OK ${row.okPct}% · NG ${row.ngPct}% · Đang làm ${row.doingPct}%`);
      setBar(`${prefix}-ok-bar`, row.okPct);
      setBar(`${prefix}-ng-bar`, row.ngPct);
      setBar(`${prefix}-doing-bar`, row.doingPct);
    };
    set('kpi-dqa-total', s.total);
    set('kpi-dqa-doing', s.doing);
    set('kpi-dqa-ng', s.ng);
    set('kpi-dqa-ok', s.ok);
    set('kpi-fmea-reviewed', fmea.reviewed);
    set('kpi-fmea-not-updated', fmea.notUpdated);
    set('kpi-fmea-not-needed', fmea.notNeeded);
    set('kpi-fmea-dqa-done', fmea.dqaDone);
    set('kpi-fmea-others-done', fmea.othersDone);
    syncStackRow('kpi-level-l1', breakdown.level.L1);
    syncStackRow('kpi-level-l2', breakdown.level.L2);
    syncStackRow('kpi-level-l3', breakdown.level.L3);
    syncStackRow('kpi-phase-s0', breakdown.phase.S0);
    syncStackRow('kpi-phase-s3', breakdown.phase.S3);
    syncStackRow('kpi-phase-t0', breakdown.phase.T0);
  }

  function setLegend(id, items) {
    const el = $(id);
    if (!el) return;
    el.innerHTML = items.map((it) => `<div class="li"><div class="ld" style="background:${it.color}"></div>${it.label}</div>`).join('');
  }

  function renderCharts(dqa, dqaStats, fmeaStats) {
    if (typeof Chart === 'undefined') return;
    destroyCharts();
    const gridColor = 'rgba(15,23,42,.08)';
    const centerTextPlugin = {
      id: 'centerText',
      afterDraw(chart, _args, pluginOptions) {
        if (!pluginOptions || !Array.isArray(pluginOptions.lines) || !pluginOptions.lines.length) return;
        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || !meta.data.length) return;
        const x = meta.data[0].x;
        const y = meta.data[0].y;
        const ctx = chart.ctx;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        pluginOptions.lines.forEach((line, idx) => {
          const yy = y + (idx === 0 ? -4 : 12);
          ctx.font = idx === 0 ? '700 16px Inter, sans-serif' : '600 10px Inter, sans-serif';
          ctx.fillStyle = idx === 0 ? '#111827' : '#64748b';
          ctx.fillText(String(line), x, yy);
        });
        ctx.restore();
      }
    };
    const arcLabelPlugin = {
      id: 'arcLabels',
      afterDatasetsDraw(chart, _args, pluginOptions) {
        if (!pluginOptions || pluginOptions.enabled !== true) return;
        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || !meta.data.length) return;
        const dataset = chart.data?.datasets?.[0];
        const values = Array.isArray(dataset?.data) ? dataset.data.map((v) => Number(v || 0)) : [];
        const total = values.reduce((a, b) => a + b, 0);
        if (total <= 0) return;
        const ctx = chart.ctx;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 10px Inter, sans-serif';
        ctx.fillStyle = '#334155';
        meta.data.forEach((arc, idx) => {
          const v = Number(values[idx] || 0);
          if (v <= 0) return;
          const pct = Math.round((v / total) * 100);
          // bỏ qua lát quá nhỏ để tránh chồng chữ
          if (pct < 6) return;
          const angle = (arc.startAngle + arc.endAngle) / 2;
          // Đặt label sát vành ngoài + ghim vào vùng an toàn để không bị cắt chữ.
          const r = arc.outerRadius + 4;
          const rawX = arc.x + Math.cos(angle) * r;
          const rawY = arc.y + Math.sin(angle) * r;
          const area = chart.chartArea || {left: 0, right: chart.width, top: 0, bottom: chart.height};
          const padX = 12;
          const padY = 10;
          const x = Math.max(area.left + padX, Math.min(area.right - padX, rawX));
          const y = Math.max(area.top + padY, Math.min(area.bottom - padY, rawY));
          ctx.fillText(`${pct}%`, x, y);
        });
        ctx.restore();
      }
    };
    const lineEndValuePlugin = {
      id: 'lineEndValue',
      afterDatasetsDraw(chart, _args, pluginOptions) {
        if (!pluginOptions || pluginOptions.enabled !== true) return;
        const datasets = chart.data?.datasets || [];
        const ctx = chart.ctx;
        ctx.save();
        datasets.forEach((ds, dsIndex) => {
          const meta = chart.getDatasetMeta(dsIndex);
          if (!meta || !meta.data || !meta.data.length) return;
          const lastPoint = meta.data[meta.data.length - 1];
          const rawLast = Array.isArray(ds.data) ? ds.data[ds.data.length - 1] : null;
          const value = Number(rawLast);
          if (!Number.isFinite(value)) return;
          const x = lastPoint.x + 4;
          const isDetectedLine = String(ds.label || '').trim().toLowerCase() === 'phát hiện';
          const y = lastPoint.y - 10 + (isDetectedLine ? 5 : 0);
          ctx.font = '700 13px Inter, sans-serif';
          ctx.fillStyle = String(ds.borderColor || '#0f172a');
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(value), x, y);
        });
        ctx.restore();
      }
    };
    const tOpts = {
      bodyColor: '#111827',
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 10
    };

    const donutEl = $('chart-dqa-donut');
    if (donutEl) {
      const dqaTotal = dqaStats.doing + dqaStats.ok + dqaStats.ng;
      donutEl._f10SpmChart = new Chart(donutEl, {
        plugins: [centerTextPlugin, arcLabelPlugin],
        type: 'doughnut',
        data: {
          labels: ['Đang đánh giá', 'Kết quả OK', 'Kết quả NG'],
          datasets: [{
            data: [dqaStats.doing, dqaStats.ok, dqaStats.ng],
            backgroundColor: ['#7c3aed', '#22c55e', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { display: false },
            tooltip: { ...tOpts, callbacks: { label: (c) => '  ' + c.label + ': ' + c.raw + ' dự án' } },
            centerText: {
              lines: [`${dqaTotal}`, 'Dự án DQA']
            },
            arcLabels: {
              enabled: true
            }
          }
        }
      });
    }
    setLegend('leg-dqa-donut', [
      {label: `Đang đánh giá (${dqaStats.doing})`, color: '#7c3aed'},
      {label: `Kết quả OK (${dqaStats.ok})`, color: '#22c55e'},
      {label: `Kết quả NG (${dqaStats.ng})`, color: '#ef4444'}
    ]);

    const lineSeries = buildDetectSeries(dqa);
    const lineEl = $('chart-detect-line');
    if (lineEl) {
      lineEl._f10SpmChart = new Chart(lineEl, {
        type: 'line',
        data: {
          labels: lineSeries.labels,
          datasets: [
            {
              label: 'Phát hiện',
              data: lineSeries.detectedData,
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220,38,38,.12)',
              borderWidth: 2,
              tension: 0.3,
              fill: false,
              pointRadius: 2
            },
            {
              label: 'Đã khắc phục',
              data: lineSeries.fixedData,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37,99,235,.14)',
              borderWidth: 2,
              tension: 0.3,
              fill: false,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { right: 28 }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: '#64748b', font: { size: 10 } }, border: { display: false } },
            y: { grid: { color: gridColor }, ticks: { color: '#64748b', font: { size: 10 } }, border: { display: false }, beginAtZero: true }
          },
          plugins: {
            legend: { display: false },
            tooltip: tOpts,
            lineEndValue: { enabled: true }
          }
        },
        plugins: [lineEndValuePlugin]
      });
    }
    setLegend('leg-detect-line', [
      {label: 'Phát hiện', color: '#dc2626'},
      {label: 'Đã khắc phục', color: '#2563eb'}
    ]);

    const fmeaRateEl = $('chart-fmea-rate');
    if (fmeaRateEl) {
      const totalFmea = fmeaStats.reviewed + fmeaStats.notUpdated + fmeaStats.notNeeded;
      const reviewedPct = totalFmea > 0 ? Math.round((fmeaStats.reviewed / totalFmea) * 100) : 0;
      fmeaRateEl._f10SpmChart = new Chart(fmeaRateEl, {
        plugins: [centerTextPlugin, arcLabelPlugin],
        type: 'doughnut',
        data: {
          labels: ['Đã rà soát', 'Chưa rà soát', 'Không cần'],
          datasets: [{
            data: [fmeaStats.reviewed, fmeaStats.notUpdated, fmeaStats.notNeeded],
            backgroundColor: ['#7c3aed', '#cbd5e1', '#f59e0b'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 2, right: 0, bottom: 24, left: 0 }
          },
          cutout: '58%',
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tOpts,
              callbacks: {
                label: (c) => {
                  const total = Array.isArray(c.dataset?.data)
                    ? c.dataset.data.reduce((a, b) => a + Number(b || 0), 0)
                    : 0;
                  const pct = total > 0 ? Math.round((Number(c.raw || 0) / total) * 100) : 0;
                  return '  ' + c.label + ': ' + c.raw + ` (${pct}%)`;
                }
              }
            },
            centerText: {
              lines: [`${reviewedPct}%`, 'Đã rà soát']
            },
            arcLabels: {
              enabled: true
            }
          }
        }
      });
    }
    const fmeaTotalCount = fmeaStats.reviewed + fmeaStats.notUpdated + fmeaStats.notNeeded;
    const reviewedLabelPct = fmeaTotalCount > 0 ? Math.round((fmeaStats.reviewed / fmeaTotalCount) * 100) : 0;
    const notUpdatedLabelPct = fmeaTotalCount > 0 ? Math.round((fmeaStats.notUpdated / fmeaTotalCount) * 100) : 0;
    const notNeededLabelPct = fmeaTotalCount > 0 ? Math.round((fmeaStats.notNeeded / fmeaTotalCount) * 100) : 0;
    setLegend('leg-fmea-rate', [
      {label: `Đã rà soát FMEA (${fmeaStats.reviewed} · ${reviewedLabelPct}%)`, color: '#7c3aed'},
      {label: `Chưa rà soát FMEA (${fmeaStats.notUpdated} · ${notUpdatedLabelPct}%)`, color: '#cbd5e1'},
      {label: `Không cần (${fmeaStats.notNeeded} · ${notNeededLabelPct}%)`, color: '#f59e0b'}
    ]);

    const fmeaTotalEl = $('chart-fmea-total');
    if (fmeaTotalEl) {
      const fmeaTotal = fmeaStats.dqaDone + fmeaStats.othersDone;
      const fmeaDqaPct = fmeaTotal > 0 ? Math.round((fmeaStats.dqaDone / fmeaTotal) * 100) : 0;
      fmeaTotalEl._f10SpmChart = new Chart(fmeaTotalEl, {
        plugins: [centerTextPlugin, arcLabelPlugin],
        type: 'doughnut',
        data: {
          labels: ['DQA bổ sung', 'Rủi ro đánh giá ban đầu'],
          datasets: [{
            data: [fmeaStats.dqaDone, fmeaStats.othersDone],
            backgroundColor: ['#22c55e', '#94a3b8'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 2, right: 0, bottom: 24, left: 0 }
          },
          cutout: '58%',
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tOpts,
              callbacks: {
                label: (c) => {
                  const total = Array.isArray(c.dataset?.data)
                    ? c.dataset.data.reduce((a, b) => a + Number(b || 0), 0)
                    : 0;
                  const pct = total > 0 ? Math.round((Number(c.raw || 0) / total) * 100) : 0;
                  return '  ' + c.label + ': ' + c.raw + ` (${pct}%)`;
                }
              }
            },
            centerText: {
              lines: [`${fmeaDqaPct}%`, 'DQA bổ sung']
            },
            arcLabels: {
              enabled: true
            }
          }
        }
      });
    }
    const fmeaTotalLegend = fmeaStats.dqaDone + fmeaStats.othersDone;
    const fmeaDqaLegendPct = fmeaTotalLegend > 0 ? Math.round((fmeaStats.dqaDone / fmeaTotalLegend) * 100) : 0;
    const fmeaOtherLegendPct = fmeaTotalLegend > 0 ? Math.round((fmeaStats.othersDone / fmeaTotalLegend) * 100) : 0;
    setLegend('leg-fmea-total', [
      {label: `DQA bổ sung (${fmeaStats.dqaDone} · ${fmeaDqaLegendPct}%)`, color: '#22c55e'},
      {label: `Rủi ro đánh giá ban đầu (${fmeaStats.othersDone} · ${fmeaOtherLegendPct}%)`, color: '#94a3b8'}
    ]);
  }

  function openProjectDetailModal(project) {
    const modal = document.getElementById('f10-spm-detail-modal');
    const body = document.getElementById('f10-spm-detail-body');
    const sub = document.getElementById('f10-spm-detail-sub');
    if (!modal || !body || !sub || !project) return;
    const yn = (v) => (v ? 'Có' : 'Không');
    const overviewDetails = [
      ['Mã dự án', project.ma],
      ['Tên dự án', project.ten],
      ['PM', project.pm],
      ['PIC DQA', project.pic],
      ['Cấp độ', project.cap],
      ['Tình trạng dự án', project.tt],
      ['KRD đang triển khai', yn(project.krd)],
      ['DQA đang triển khai', yn(project.dqa)]
    ];
    const qualityDetails = [
      ['Giai đoạn nhận mẫu', project.ph],
      ['Đang đánh giá', project.dd],
      ['KQ ĐG OK', project.ok],
      ['KQ ĐG NG', project.ng],
      ['Số lượng cải tiến lỗi', project.soLuongCaiTien],
      ['Tổng lỗi', project.tongLoi],
      ['Tỷ lệ cải tiến trên tổng lỗi', project.tiLeCaiTien]
    ];
    const fmeaDetails = [
      ['Hạng mục FMEA rà soát bổ sung', project.hmFmea],
      ['Tổng hạng mục rà soát FMEA', project.tongHmFmea],
      ['Tỉ lệ rà soát FMEA', project.fmea]
    ];
    sub.textContent = `${project.ma || '—'} · ${project.ten || '—'}`;
    const itemGrid = (rows) =>
      `<div class="f10-spm-detail-grid">${rows
        .map(([lb, val]) => `<div class="f10-spm-detail-item"><div class="lb">${escHtml(lb)}</div><div class="val">${val ? val : '—'}</div></div>`)
        .join('')}</div>`;
    const subgroup = (title, rows, cls = '') =>
      `<div class="f10-spm-detail-subgroup ${cls}"><div class="f10-spm-detail-subtitle">${escHtml(title)}</div>${itemGrid(rows)}</div>`;
    const section = (title, htmlBody, cls = '') =>
      `<div class="f10-spm-detail-sec ${cls}">
        <div class="f10-spm-detail-sec-title">${escHtml(title)}</div>
        ${htmlBody}
      </div>`;

    const qualityHtml =
      subgroup('Trạng thái đánh giá', [
        ['Giai đoạn nhận mẫu', project.ph],
        ['Đang đánh giá', project.dd],
        ['KQ ĐG OK', project.ok],
        ['KQ ĐG NG', project.ng]
      ]);

    const improveHtml = subgroup('Cải tiến lỗi', [
      ['Số lượng cải tiến lỗi', project.soLuongCaiTien],
      ['Tổng lỗi', project.tongLoi],
      ['Tỷ lệ cải tiến trên tổng lỗi', project.tiLeCaiTien],
      ['Link kết quả cải tiến lỗi', project.linkCaiTien ? `<a class="jira-link" href="${escHtml(project.linkCaiTien)}" target="_blank" rel="noopener noreferrer">${escHtml(project.linkCaiTien)}</a>` : '—']
    ]);

    const fmeaHtml =
      subgroup('Chỉ số FMEA', [
        ['Hạng mục FMEA rà soát bổ sung', project.hmFmea],
        ['Tổng hạng mục rà soát FMEA', project.tongHmFmea]
      ]) +
      subgroup('Kết quả FMEA', [
        ['Tỉ lệ rà soát FMEA', project.fmea],
        ['Link kết quả FMEA', project.linkFmea ? `<a class="jira-link" href="${escHtml(project.linkFmea)}" target="_blank" rel="noopener noreferrer">${escHtml(project.linkFmea)}</a>` : '—']
      ]);

    const linksHtml =
      subgroup('Liên kết', [
        ['Link Jira', project.jira ? `<a class="jira-link" href="${escHtml(project.jira)}" target="_blank" rel="noopener noreferrer">${escHtml(project.jira)}</a>` : '—']
      ]) +
      subgroup('Ghi chú', [['Nội dung ghi chú', project.ghiChu ? escHtml(project.ghiChu) : '—']]);

    body.innerHTML =
      section('Tổng quan dự án', itemGrid(overviewDetails), 'sec-overview') +
      section('Chất lượng', qualityHtml, 'sec-quality') +
      section('Cải tiến lỗi', improveHtml, 'sec-improve') +
      section('FMEA', fmeaHtml, 'sec-fmea') +
      section('Liên kết và ghi chú', linksHtml, 'sec-links');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeProjectDetailModal() {
    const modal = document.getElementById('f10-spm-detail-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function getBreakdownRows(type, key) {
    const all = Array.isArray(F10SPM_ALL) ? F10SPM_ALL : [];
    const dqa = all.filter((p) => p && p.dqa === 1);
    const normType = String(type || '').trim().toLowerCase();
    const normKey = String(key || '').trim().toUpperCase();
    if (normType === 'level') return dqa.filter((p) => String(p.cap || '').trim().toUpperCase() === normKey);
    if (normType === 'phase') return dqa.filter((p) => String(p.ph || '').trim().toUpperCase() === normKey);
    return dqa;
  }

  function getBreakdownStats(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const total = list.length;
    let ok = 0;
    let ng = 0;
    let doing = 0;
    list.forEach((p) => {
      if (String(p.dd || '').trim().toLowerCase() === 'doing') doing += 1;
      else if (String(p.ng || '').trim().toUpperCase() === 'NG') ng += 1;
      else if (String(p.ok || '').trim().toUpperCase() === 'OK') ok += 1;
      else doing += 1;
    });
    const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return { total, ok, ng, doing, okPct: pct(ok), ngPct: pct(ng), doingPct: pct(doing) };
  }

  function buildSourceRowsTable(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
      return '<div class="f10-spm-source-empty">Không có dự án phù hợp với nhóm này.</div>';
    }
    return `
      <div class="f10-spm-source-table-wrap">
        <table class="f10-spm-source-table">
          <thead>
            <tr>
              <th>Mã dự án</th>
              <th>Tên dự án</th>
              <th>PM</th>
              <th>PIC DQA</th>
              <th>Cấp</th>
              <th>Giai đoạn</th>
              <th>OK</th>
              <th>NG</th>
              <th>Doing</th>
              <th>FMEA</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((p) => `
              <tr>
                <td>${escHtml(p.ma || '—')}</td>
                <td>${escHtml(p.ten || '—')}</td>
                <td>${escHtml(p.pm || '—')}</td>
                <td>${escHtml(p.pic || '—')}</td>
                <td>${escHtml(p.cap || '—')}</td>
                <td>${escHtml(p.ph || '—')}</td>
                <td>${escHtml(String(p.ok || '').trim().toUpperCase() === 'OK' ? 'OK' : '—')}</td>
                <td>${escHtml(String(p.ng || '').trim().toUpperCase() === 'NG' ? 'NG' : '—')}</td>
                <td>${escHtml(String(p.dd || '').trim().toLowerCase() === 'doing' ? 'Doing' : '—')}</td>
                <td>${escHtml(p.fmea || '—')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function openSourceModal(options = {}) {
    const modal = document.getElementById('f10-spm-source-modal');
    const body = document.getElementById('f10-spm-source-body');
    const title = document.getElementById('f10-spm-source-title');
    const sub = document.getElementById('f10-spm-source-sub');
    if (!modal || !body || !title || !sub) return;

    const type = String(options.type || '').trim().toLowerCase();
    const key = String(options.key || '').trim().toUpperCase();
    const rows = type && key ? getBreakdownRows(type, key) : getBreakdownRows('', '');
    const stats = getBreakdownStats(rows);
    const label = key || 'Dashboard';
    const scopeText = type === 'level'
      ? `Nhóm cấp độ ${label}`
      : (type === 'phase' ? `Nhóm giai đoạn ${label}` : 'Toàn bộ dashboard DQA');

    title.textContent = type && key ? `Nguồn dữ liệu: ${label}` : 'Nguồn dữ liệu Dashboard';
    sub.textContent = type && key
      ? `Drill-down cho ${scopeText}. Dữ liệu lấy từ webhook Form 10 và chỉ gồm các dự án có cờ DQA đang triển khai.`
      : 'Tổng hợp từ webhook Form 10 / Form 11 SPM 2026. Các biểu đồ được tính từ danh sách dự án DQA đang triển khai.';

    const explanation = type && key
      ? `Bộ đếm này lấy các dòng có DQA đang triển khai = Có, sau đó lọc theo ${type === 'level' ? 'Cấp độ' : 'Giai đoạn'} = ${label}. Trạng thái OK/NG/Doing được suy ra từ các cột KQ ĐG OK, KQ ĐG NG và Đang đánh giá.`
      : 'Dashboard Form 10 dùng cùng nguồn dữ liệu dự án SPM 2026. Các biểu đồ donut/line/FMEA đọc từ cùng tập dòng, sau đó nhóm theo trạng thái đánh giá, số lỗi cải tiến và trường FMEA.';

    body.innerHTML = `
      <section class="f10-spm-source-panel">
        <h5>Giải thích cách tính</h5>
        <p class="f10-spm-source-note">${escHtml(explanation)}</p>
      </section>
      <section class="f10-spm-source-panel">
        <h5>Tóm tắt nguồn</h5>
        <div class="f10-spm-source-meta">
          <div class="f10-spm-source-meta-item"><span class="lb">Phạm vi</span><span class="val">${escHtml(scopeText)}</span></div>
          <div class="f10-spm-source-meta-item"><span class="lb">Số dự án</span><span class="val">${stats.total}</span></div>
          <div class="f10-spm-source-meta-item"><span class="lb">Mix trạng thái</span><span class="val">OK ${stats.okPct}% · NG ${stats.ngPct}% · Doing ${stats.doingPct}%</span></div>
          <div class="f10-spm-source-meta-item"><span class="lb">Raw fields</span><span class="val">DQA đang triển khai, Cấp độ, Giai đoạn nhận mẫu, KQ ĐG OK, KQ ĐG NG, Đang đánh giá, FMEA</span></div>
        </div>
      </section>
      <section class="f10-spm-source-panel">
        <h5>Dòng dữ liệu đang dùng</h5>
        ${buildSourceRowsTable(rows)}
      </section>
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeSourceModal() {
    const modal = document.getElementById('f10-spm-source-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function bindFilters() {
    $('refresh-btn')?.addEventListener('click', () => {
      void window.F10SpmDashboardInit();
    });
    document.getElementById('f10-spm-source-btn')?.addEventListener('click', () => openSourceModal());
    document.getElementById('f10-spm-detail-close')?.addEventListener('click', closeProjectDetailModal);
    document.getElementById('f10-spm-detail-overlay')?.addEventListener('click', closeProjectDetailModal);
    document.getElementById('f10-spm-source-close')?.addEventListener('click', closeSourceModal);
    document.getElementById('f10-spm-source-overlay')?.addEventListener('click', closeSourceModal);
    document.querySelectorAll('#f10-spm-breakdown-list .f10-side-item[data-breakdown-key]').forEach((el) => {
      el.addEventListener('click', () => {
        openSourceModal({
          type: el.getAttribute('data-breakdown-type') || '',
          key: el.getAttribute('data-breakdown-key') || ''
        });
      });
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') closeProjectDetailModal();
      if (ev.key === 'Escape') closeSourceModal();
    });
    // click detail giữ lại để tương thích các phần modal nếu cần mở rộng sau.
  }

  function runFullRefreshFromRows(DATA) {
    F10SPM_ALL = Array.isArray(DATA) ? DATA : [];
    const krd = F10SPM_ALL.filter((p) => p.krd === 1);
    const dqa = F10SPM_ALL.filter((p) => p.dqa === 1);

    syncHeaderTags(F10SPM_ALL.length, dqa.length);
    const kst = computeKrdStats(krd);
    const dst = computeDqaStats(dqa);
    const fmea = computeFmeaStats(dqa);
    const breakdown = computeLevelPhaseStats(dqa);
    syncKrdKpis(kst);
    syncDqaKpis(dst, fmea, breakdown);
    renderCharts(dqa, dst, fmea);
    window.F10SPM_DASHBOARD_DATA = F10SPM_ALL;
  }

  let f10SpmBound = false;

  window.F10SpmDashboardInit = async function () {
    const root = document.querySelector('#form10 .f10-spm-root');
    if (!root) return;
    if (!f10SpmBound) {
      f10SpmBound = true;
      bindFilters();
    }
    const hdr = $('hdr-month');
    if (hdr) hdr.textContent = 'Đang tải…';
    try {
      const DATA = await fetchForm10SpmData();
      runFullRefreshFromRows(DATA);
    } catch (err) {
      console.error('[Form10 SPM]', err);
      runFullRefreshFromRows([]);
      if (typeof showToast === 'function') showToast('Form 10: ' + (err.message || err), 'error');
    }
  };
})();
