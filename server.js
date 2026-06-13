import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const FORM5_DIST_DIR = join(__dirname, 'form5-dist');

const WEBHOOKS = {
  reports: process.env.REPORTS_QUERY_URL || 'https://iatzhxxuk.tino.page/webhook/laydulieupheduyettruongnhom',
  groupAssignment: process.env.GROUP_ASSIGNMENT_URL || 'https://iatzhxxuk.tino.page/webhook/Phanchianhom',
  dashboard: process.env.DASHBOARD_SUMMARY_URL || 'https://iatzhxxuk.tino.page/webhook/Dashboardtonghop',
  overtimeByPerson: process.env.OVERTIME_BY_PERSON_URL || 'https://iatzhxxuk.tino.page/webhook/laysogiotangcatheothang',
  reportAction: process.env.APPROVE_URL || 'https://iatzhxxuk.tino.page/webhook/Duyetbaocaochotruongnhom1',
  detail: process.env.WEBHOOK_DETAIL || 'https://iatzhxxuk.tino.page/webhook/1df40252-6bff-4392-bb1a-5ae72ee748d1',
  pdforms: process.env.PDFORM_QUERY_URL || 'https://iatzhxxuk.tino.page/webhook/PheduyenformTP',
  pdformAction: process.env.PDFORM_ACTION_URL || 'https://iatzhxxuk.tino.page/webhook/DuyetformTN',
  tpDetail: process.env.TP_WEBHOOK_DETAIL || 'https://iatzhxxuk.tino.page/webhook/1df40252-6bff-4392-bb1a-5ae72ee748d1',
  tpReports: process.env.TP_REPORTS_QUERY_URL || 'https://iatzhxxuk.tino.page/webhook/laydulieupheduyettruongphong',
  tpReportAction: process.env.TP_FORM_ACTION_URL || 'https://iatzhxxuk.tino.page/webhook/Duyetbaocaochotruongphong',
  tpForm3: process.env.TP_FORM3_ENDPOINT || 'https://iatzhxxuk.tino.page/webhook/21b742a9-a6b0-4393-9325-bfa470db5917',
  tpForm4Lookup: process.env.TP_FORM4_LOOKUP_URL || 'https://iatzhxxuk.tino.page/webhook/ddc1264c-85be-4b63-98a6-267103685117',
  tpForm5Stats: process.env.TP_FORM5_STATS_URL || 'https://iatzhxxuk.tino.page/webhook/4744d882-be8d-4939-a516-9229ba7dc87a',
  tpStatsDetail: process.env.TP_STATS_DETAIL_URL || 'https://iatzhxxuk.tino.page/webhook/fdf2d106-5b1c-46ca-bc8a-937ca7a9968d',
  tpNctnReports: process.env.TP_NCTN_REPORTS_QUERY_URL || 'https://xcqiyibqs.tino.page/webhook/laydulieupheduyettruongphong',
  tpNctnAction: process.env.TP_NCTN_FORM_ACTION_URL || 'https://xcqiyibqs.tino.page/webhook/TPpheduyetBCNCTN2',
  tpNctnHistory: process.env.TP_NCTN_HISTORY_URL || 'https://xcqiyibqs.tino.page/webhook/tracuulichsupheduyet',
  tpPdforms: process.env.TP_PDFORM_QUERY_URL || 'https://iatzhxxuk.tino.page/webhook/PheduyenformTP',
  tpPdformAction: process.env.TP_PDFORM_ACTION_URL || 'https://iatzhxxuk.tino.page/webhook/DuyetformTP'
  ,
  // ---- Imported from deploy-max-clean-v7 (Form 5 KPI thang) ----
  form5P1: process.env.FORM5_P1_URL || 'https://iatzhxxuk.tino.page/webhook/form5-p1',
  form5P2: process.env.FORM5_P2_URL || 'https://iatzhxxuk.tino.page/webhook/form5theP2',
  form5P3: process.env.FORM5_P3_URL || 'https://iatzhxxuk.tino.page/webhook/tinhthep3p4',
  form5P4: process.env.FORM5_P4_URL || 'https://iatzhxxuk.tino.page/webhook/tinhthep4',
  form5SubtaskCreate: process.env.FORM5_SUBTASK_CREATE_URL || 'https://iatzhxxuk.tino.page/webhook/form5-subtask-create'
  ,
  // ---- Imported from deploy-max-clean-v7 (Form 4 Timeline / Gantt) ----
  form4Dashboard: process.env.FORM4_DASHBOARD_URL || 'https://iatzhxxuk.tino.page/webhook/Dashboard1form4',
  form4Subbars: process.env.FORM4_SUBBARS_URL || 'https://iatzhxxuk.tino.page/webhook/thanhphuform4DB',
  form4ProjectCodes: process.env.FORM4_PROJECT_CODES_URL || 'https://iatzhxxuk.tino.page/webhook/laydulieumaduan',
  form4PicUsers: process.env.FORM4_PIC_USERS_URL || 'https://iatzhxxuk.tino.page/webhook/laydulieuPIC'
  ,
  // ---- Imported from deploy-max-clean-v7 (Form 12 Dashboard ty le / catalog) ----
  form12Lookup: process.env.FORM12_LOOKUP_URL || 'https://iatzhxxuk.tino.page/webhook/tracuumadanhmuc',
  form12Upload: process.env.FORM12_UPLOAD_URL || 'https://iatzhxxuk.tino.page/webhook/uploadmadanhmuc',
  form12Update: process.env.FORM12_UPDATE_URL || 'https://iatzhxxuk.tino.page/webhook/Capnhatmadanhmuc',
  form10Spm: process.env.FORM10_SPM_URL || 'https://iatzhxxuk.tino.page/webhook/cong2form10'
};

const SESSION_COOKIE = 'tnreview_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();

const USERS = [
  { username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin123', name: 'Quản trị hệ thống', role: 'Admin', team: 'DQA' },
  { username: 'truongphong', password: process.env.MANAGER_PASSWORD || 'tp123', name: 'Trưởng phòng DQA', role: 'Trưởng phòng', team: 'DQA' },
  { username: 'linh', password: process.env.LINH_PASSWORD || 'linh123', name: 'Nguyễn Văn Linh', role: 'Trưởng nhóm', team: 'Nhóm Linh' },
  { username: 'hieu', password: process.env.HIEU_PASSWORD || 'hieu123', name: 'Nguyễn Văn Hiếu', role: 'Trưởng nhóm', team: 'Nhóm Hiếu' }
];

/** Tên đăng nhập portal DQA (localStorage dqa.user) từ session TaskHub */
const PORTAL_USER_BY_TASKHUB = {
  linh: 'Nguyễn Văn Linh',
  hieu: 'Nguyễn Văn Hiếu',
  admin: 'Nguyễn Văn Linh',
  truongphong: 'Nguyễn Văn Linh'
};

function portalUserForSession(session) {
  if (!session?.user) return null;
  const mapped = PORTAL_USER_BY_TASKHUB[session.user.username];
  if (mapped) return mapped;
  return session.user.name || null;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(body);
}

function contentTypeForPath(filePath) {
  const lower = String(filePath).toLowerCase();
  if (lower.endsWith('.html')) return 'text/html; charset=utf-8';
  if (lower.endsWith('.css')) return 'text/css; charset=utf-8';
  if (lower.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.svg')) return 'image/svg+xml; charset=utf-8';
  if (lower.endsWith('.ico')) return 'image/x-icon';
  return 'application/octet-stream';
}

function publicUser(user) {
  if (!user) return null;
  return { username: user.username, name: user.name, role: user.role, team: user.team };
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  });
  return out;
}

function getSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return { token, user: session.user };
}

function isPublicApi(pathname) {
  return (
    pathname.startsWith('/api/form5/') ||
    pathname.startsWith('/api/form4/') ||
    pathname.startsWith('/api/form12/')
  );
}

function requireAuth(req, res) {
  const session = getSession(req);
  if (session) return session;
  send(res, 401, JSON.stringify({ error: 'Unauthorized' }), {
    'Content-Type': 'application/json; charset=utf-8'
  });
  return null;
}

function requireManager(req, res) {
  const session = requireAuth(req, res);
  if (!session) return null;
  if (session.user.role === 'Admin' || session.user.role === 'Trưởng phòng') return session;
  send(res, 403, JSON.stringify({ error: 'Forbidden' }), {
    'Content-Type': 'application/json; charset=utf-8'
  });
  return null;
}

async function handleLogin(req, res) {
  if (!methodAllowed(req, res, ['POST'])) return;
  const body = await readRequestBody(req);
  let payload = {};
  try {
    payload = JSON.parse(body.toString('utf8') || '{}');
  } catch {
    payload = Object.fromEntries(new URLSearchParams(body.toString('utf8')));
  }

  const user = USERS.find(item => (
    item.username === String(payload.username || '').trim() &&
    safeEqual(item.password, payload.password)
  ));

  if (!user) {
    send(res, 401, JSON.stringify({ error: 'Sai tài khoản hoặc mật khẩu' }), {
      'Content-Type': 'application/json; charset=utf-8'
    });
    return;
  }

  const token = randomBytes(32).toString('hex');
  sessions.set(token, { user: publicUser(user), expiresAt: Date.now() + SESSION_TTL_MS });
  send(res, 200, JSON.stringify({ user: publicUser(user) }), {
    'Content-Type': 'application/json; charset=utf-8',
    'Set-Cookie': `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`
  });
}

function handleSession(req, res) {
  if (!methodAllowed(req, res, ['GET'])) return;
  const session = getSession(req);
  send(res, 200, JSON.stringify({ user: session ? session.user : null }), {
    'Content-Type': 'application/json; charset=utf-8'
  });
}

function handleLogout(req, res) {
  if (!methodAllowed(req, res, ['POST'])) return;
  const session = getSession(req);
  if (session) sessions.delete(session.token);
  send(res, 200, JSON.stringify({ ok: true }), {
    'Content-Type': 'application/json; charset=utf-8',
    'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
  });
}

function methodAllowed(req, res, methods) {
  if (methods.includes(req.method)) return true;
  send(res, 405, 'Method Not Allowed', {
    Allow: methods.join(', '),
    'Content-Type': 'text/plain; charset=utf-8'
  });
  return false;
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function upstreamUrl(target, reqUrl) {
  const incoming = new URL(reqUrl, `http://localhost:${PORT}`);
  const upstream = new URL(target);
  incoming.searchParams.forEach((value, key) => upstream.searchParams.append(key, value));
  return upstream;
}

async function proxyRequest(req, res, target, methods) {
  if (!methodAllowed(req, res, methods)) return;

  try {
    const url = upstreamUrl(target, req.url);
    const headers = {};
    const contentType = req.headers['content-type'];
    if (contentType) headers['Content-Type'] = contentType;

    const init = {
      method: req.method,
      headers,
      redirect: 'follow'
    };

    if (!['GET', 'HEAD'].includes(req.method)) {
      const body = await readRequestBody(req);
      init.body = body.length ? body : undefined;
      if (req.headers['content-length']) headers['Content-Length'] = String(body.length);
    }

    const upstreamResponse = await fetch(url, init);
    const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());
    const responseHeaders = {
      'Content-Type': upstreamResponse.headers.get('content-type') || 'text/plain; charset=utf-8'
    };

    send(res, upstreamResponse.status, responseBody, responseHeaders);
  } catch (error) {
    send(
      res,
      502,
      JSON.stringify({ error: 'Bad Gateway', message: String(error?.message || error) }),
      { 'Content-Type': 'application/json; charset=utf-8' }
    );
  }
}

function normalizeN8nJson(payload) {
  // Match deploy-max-clean-v7/server/server.mjs behavior:
  // - sometimes upstream is [{ json: {...} }] or [{ data: [...] }]
  // - sometimes upstream is { json: {...} }
  let normalized = payload;
  if (normalized && typeof normalized === 'object') {
    const looksArrayLike = Array.isArray(normalized) || typeof normalized.length === 'number';
    if (looksArrayLike && normalized.length === 1 && normalized[0] && typeof normalized[0] === 'object') {
      const first = normalized[0];
      if (first.json && typeof first.json === 'object') normalized = first.json;
      else if (Array.isArray(first.data)) normalized = first.data;
    } else if (normalized.json && typeof normalized.json === 'object') {
      normalized = normalized.json;
    }
  }
  return normalized;
}

function pickRowsFromNormalized(normalized) {
  if (Array.isArray(normalized)) return normalized;
  if (normalized && typeof normalized === 'object') {
    if (Array.isArray(normalized.rows)) return normalized.rows;
    if (Array.isArray(normalized.data)) return normalized.data;
    if (Array.isArray(normalized.records)) return normalized.records;
  }
  return [];
}

function pickRowsLoose(normalized) {
  // Similar to deploy-max-clean-v7: accept array or {rows|data|records}
  return pickRowsFromNormalized(normalized);
}

async function fetchJsonOrText(url) {
  const r = await fetch(url, { method: 'GET' });
  const text = await r.text().catch(() => '');
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
  return { ok: r.ok, status: r.status, text, parsed };
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://localhost:${PORT}`);
  try {
    // Main app (existing)
    if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') {
      const filePath = join(__dirname, 'index.html');
      const body = await readFile(filePath);
      send(res, 200, body, { 'Content-Type': 'text/html; charset=utf-8' });
      return;
    }

    // Form 5 app (ported from deploy-max-clean-v7/dist)
    if (requestUrl.pathname === '/form5' || requestUrl.pathname === '/form5/') {
      const body = await readFile(join(FORM5_DIST_DIR, 'index.html'));
      send(res, 200, body, { 'Content-Type': 'text/html; charset=utf-8' });
      return;
    }

    if (requestUrl.pathname.startsWith('/form5/')) {
      // Basic static file server for /form5/* assets
      const rel = requestUrl.pathname.slice('/form5/'.length);
      if (!rel || rel.includes('..')) {
        send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
      }
      const filePath = join(FORM5_DIST_DIR, rel);
      const body = await readFile(filePath);
      send(res, 200, body, { 'Content-Type': contentTypeForPath(filePath) });
      return;
    }

    // Compatibility routes: some pages/assets inside the imported build use absolute paths.
    if (requestUrl.pathname.startsWith('/assets/')) {
      const rel = requestUrl.pathname.slice('/assets/'.length);
      if (!rel || rel.includes('..')) {
        send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
      }
      const filePath = join(FORM5_DIST_DIR, 'assets', rel);
      const body = await readFile(filePath);
      send(res, 200, body, { 'Content-Type': contentTypeForPath(filePath) });
      return;
    }

    if (requestUrl.pathname.startsWith('/c2/')) {
      const rel = requestUrl.pathname.slice('/c2/'.length);
      if (!rel || rel.includes('..')) {
        send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
      }
      const filePath = join(FORM5_DIST_DIR, 'c2', rel);
      const body = await readFile(filePath);
      send(res, 200, body, { 'Content-Type': contentTypeForPath(filePath) });
      return;
    }

    send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch {
    send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  if (pathname === '/api/health') {
    send(res, 200, JSON.stringify({ ok: true }), {
      'Content-Type': 'application/json; charset=utf-8'
    });
    return;
  }

  if (pathname === '/api/login') {
    await handleLogin(req, res);
    return;
  }

  if (pathname === '/api/session') {
    handleSession(req, res);
    return;
  }

  if (pathname === '/api/portal/embed-user') {
    if (!methodAllowed(req, res, ['GET'])) return;
    const session = requireAuth(req, res);
    if (!session) return;
    const portalUser = portalUserForSession(session);
    send(res, 200, JSON.stringify({ portalUser }), {
      'Content-Type': 'application/json; charset=utf-8'
    });
    return;
  }

  if (pathname === '/api/logout') {
    handleLogout(req, res);
    return;
  }

  if (pathname.startsWith('/api/tp/') && !requireManager(req, res)) return;
  // Some imported apps expose their APIs publicly (no auth).
  if (!isPublicApi(pathname) && pathname.startsWith('/api/') && !requireAuth(req, res)) return;

  // ---- Form 4 Timeline / Gantt (ported from deploy-max-clean-v7) ----
  if (pathname === '/api/form4/dashboard') {
    try {
      const { ok, status, text, parsed } = await fetchJsonOrText(WEBHOOKS.form4Dashboard);
      if (!ok) {
        send(res, 502, JSON.stringify({ ok: false, error: text || `HTTP ${status || 502}` }), {
          'Content-Type': 'application/json; charset=utf-8'
        });
        return;
      }

      // Flatten [{ assignee, tasks:[...] }, ...] -> rows[]
      const rows = [];
      const data = parsed ?? {};
      if (Array.isArray(data)) {
        for (const item of data) {
          const assignee = item?.assignee ?? '';
          if (Array.isArray(item?.tasks)) {
            for (const t of item.tasks) {
              rows.push({
                assignee: t?.assignee ?? assignee ?? '',
                task_code: t?.task_code ?? '',
                task_name: t?.task_name ?? '',
                start_time: t?.start_time ?? '',
                end_time: t?.end_time ?? '',
                points: t?.work_points ?? t?.points ?? 0
              });
            }
          }
        }
      }

      send(res, 200, JSON.stringify({ ok: true, rows, raw: parsed ?? text }), {
        'Content-Type': 'application/json; charset=utf-8'
      });
    } catch (error) {
      send(res, 500, JSON.stringify({ ok: false, error: String(error?.message || error) }), {
        'Content-Type': 'application/json; charset=utf-8'
      });
    }
    return;
  }

  if (pathname === '/api/form4/subbars') {
    try {
      const { ok, status, text, parsed } = await fetchJsonOrText(WEBHOOKS.form4Subbars);
      if (!ok) {
        send(res, 502, JSON.stringify({ ok: false, error: text || `HTTP ${status || 502}` }), {
          'Content-Type': 'application/json; charset=utf-8'
        });
        return;
      }
      const normalized = normalizeN8nJson(parsed);
      const rows = pickRowsLoose(normalized ?? {});
      send(res, 200, JSON.stringify({ ok: true, rows, raw: parsed ?? text }), {
        'Content-Type': 'application/json; charset=utf-8'
      });
    } catch (error) {
      send(res, 500, JSON.stringify({ ok: false, error: String(error?.message || error) }), {
        'Content-Type': 'application/json; charset=utf-8'
      });
    }
    return;
  }

  if (pathname === '/api/form4/project-codes') {
    try {
      const url = `${WEBHOOKS.form4ProjectCodes}?_ts=${Date.now()}`;
      const { ok, status, text, parsed } = await fetchJsonOrText(url);
      if (!ok) {
        send(res, 502, JSON.stringify({ ok: false, error: text || `HTTP ${status || 502}` }), {
          'Content-Type': 'application/json; charset=utf-8'
        });
        return;
      }
      const normalized = normalizeN8nJson(parsed);
      const rows = pickRowsLoose(normalized ?? {});
      send(res, 200, JSON.stringify({ ok: true, rows, raw: parsed ?? text }), {
        'Content-Type': 'application/json; charset=utf-8'
      });
    } catch (error) {
      send(res, 500, JSON.stringify({ ok: false, error: String(error?.message || error) }), {
        'Content-Type': 'application/json; charset=utf-8'
      });
    }
    return;
  }

  if (pathname === '/api/form4/pic-users') {
    try {
      const url = `${WEBHOOKS.form4PicUsers}?_ts=${Date.now()}`;
      const { ok, status, text, parsed } = await fetchJsonOrText(url);
      if (!ok) {
        send(res, 502, JSON.stringify({ ok: false, error: text || `HTTP ${status || 502}` }), {
          'Content-Type': 'application/json; charset=utf-8'
        });
        return;
      }
      const normalized = normalizeN8nJson(parsed);
      const rows = pickRowsLoose(normalized ?? {});
      send(res, 200, JSON.stringify({ ok: true, rows, raw: parsed ?? text }), {
        'Content-Type': 'application/json; charset=utf-8'
      });
    } catch (error) {
      send(res, 500, JSON.stringify({ ok: false, error: String(error?.message || error) }), {
        'Content-Type': 'application/json; charset=utf-8'
      });
    }
    return;
  }

  if (pathname === '/api/reports') {
    await proxyRequest(req, res, WEBHOOKS.reports, ['GET', 'POST']);
    return;
  }

  if (pathname === '/api/groups') {
    await proxyRequest(req, res, WEBHOOKS.groupAssignment, ['GET', 'POST']);
    return;
  }

  if (pathname === '/api/dashboard') {
    await proxyRequest(req, res, WEBHOOKS.dashboard, ['GET', 'POST']);
    return;
  }

  if (pathname === '/api/form10/spm-data') {
    await proxyRequest(req, res, WEBHOOKS.form10Spm, ['GET', 'POST']);
    return;
  }

  if (pathname === '/api/overtime-by-person') {
    await proxyRequest(req, res, WEBHOOKS.overtimeByPerson, ['GET', 'POST']);
    return;
  }

  if (pathname === '/api/report-action') {
    await proxyRequest(req, res, WEBHOOKS.reportAction, ['POST']);
    return;
  }

  if (pathname === '/api/detail') {
    await proxyRequest(req, res, WEBHOOKS.detail, ['GET']);
    return;
  }

  if (pathname === '/api/pdforms') {
    await proxyRequest(req, res, WEBHOOKS.pdforms, ['GET']);
    return;
  }

  if (pathname === '/api/pdform-action') {
    await proxyRequest(req, res, WEBHOOKS.pdformAction, ['GET', 'POST']);
    return;
  }

  // ---- Form 12 (ported as raw proxy) ----
  if (pathname === '/api/form12/lookup') {
    await proxyRequest(req, res, WEBHOOKS.form12Lookup, ['GET', 'POST']);
    return;
  }
  if (pathname === '/api/form12/upload') {
    await proxyRequest(req, res, WEBHOOKS.form12Upload, ['POST']);
    return;
  }
  if (pathname === '/api/form12/update') {
    await proxyRequest(req, res, WEBHOOKS.form12Update, ['POST']);
    return;
  }

  // ---- Form 5 KPI thang (ported from deploy-max-clean-v7) ----
  if (pathname.startsWith('/api/form5/')) {
    if (!methodAllowed(req, res, ['GET', 'POST'])) return;

    // GET /api/form5/:tab?month=YYYY-MM
    if (req.method === 'GET') {
      const tab = String(pathname.split('/').pop() || '').toLowerCase();
      const incoming = new URL(req.url, `http://localhost:${PORT}`);
      const month = String(incoming.searchParams.get('month') || '').trim();
      const qs = new URLSearchParams();
      if (month) qs.append('month', month);
      qs.append('_ts', String(Date.now()));

      let base = null;
      if (tab === 'p1') base = WEBHOOKS.form5P1;
      else if (tab === 'p2') base = WEBHOOKS.form5P2;
      else if (tab === 'p3') base = WEBHOOKS.form5P3;
      else if (tab === 'p4') base = WEBHOOKS.form5P4;
      else {
        send(res, 400, JSON.stringify({ ok: false, error: 'Invalid tab' }), {
          'Content-Type': 'application/json; charset=utf-8'
        });
        return;
      }

      try {
        const url = `${base}?${qs.toString()}`;
        const { ok, status, text, parsed } = await fetchJsonOrText(url);
        if (!ok) {
          send(res, status || 502, JSON.stringify({
            ok: false,
            error: `Webhook Form 5 ${tab.toUpperCase()} lỗi HTTP ${status || 502}`,
            upstreamStatus: status,
            upstreamBody: String(text || '').slice(0, 500)
          }), { 'Content-Type': 'application/json; charset=utf-8' });
          return;
        }
        const normalized = normalizeN8nJson(parsed);
        const rows = pickRowsFromNormalized(normalized);
        send(res, 200, JSON.stringify({ ok: true, rows, raw: normalized ?? parsed ?? text }), {
          'Content-Type': 'application/json; charset=utf-8'
        });
      } catch (error) {
        send(res, 500, JSON.stringify({ ok: false, error: String(error?.message || error) }), {
          'Content-Type': 'application/json; charset=utf-8'
        });
      }
      return;
    }

    // POST /api/form5/subtask-create
    if (req.method === 'POST' && pathname === '/api/form5/subtask-create') {
      try {
        const body = await readRequestBody(req);
        let payload = {};
        try { payload = JSON.parse(body.toString('utf8') || '{}'); } catch { payload = {}; }

        const upstream = await fetch(WEBHOOKS.form5SubtaskCreate, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await upstream.text().catch(() => '');
        let parsed = null;
        try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
        if (!upstream.ok) {
          send(res, 502, JSON.stringify({ ok: false, error: text || `HTTP ${upstream.status}` }), {
            'Content-Type': 'application/json; charset=utf-8'
          });
          return;
        }
        send(res, 200, JSON.stringify({ ok: true, status: upstream.status, data: parsed, raw: text }), {
          'Content-Type': 'application/json; charset=utf-8'
        });
      } catch (error) {
        send(res, 500, JSON.stringify({ ok: false, error: String(error?.message || error) }), {
          'Content-Type': 'application/json; charset=utf-8'
        });
      }
      return;
    }
  }

  const tpRoutes = {
    '/api/tp/detail': [WEBHOOKS.tpDetail, ['GET', 'POST']],
    '/api/tp/reports': [WEBHOOKS.tpReports, ['GET', 'POST']],
    '/api/tp/form5-list': [WEBHOOKS.tpDetail, ['GET', 'POST']],
    '/api/tp/report-action': [WEBHOOKS.tpReportAction, ['GET', 'POST']],
    '/api/tp/form3': [WEBHOOKS.tpForm3, ['GET', 'POST']],
    '/api/tp/form4-lookup': [WEBHOOKS.tpForm4Lookup, ['GET', 'POST']],
    '/api/tp/form5-stats': [WEBHOOKS.tpForm5Stats, ['GET', 'POST']],
    '/api/tp/stats-detail': [WEBHOOKS.tpStatsDetail, ['GET', 'POST']],
    '/api/tp/nctn-reports': [WEBHOOKS.tpNctnReports, ['GET', 'POST']],
    '/api/tp/nctn-action': [WEBHOOKS.tpNctnAction, ['GET', 'POST']],
    '/api/tp/nctn-history': [WEBHOOKS.tpNctnHistory, ['GET', 'POST']],
    '/api/tp/pdforms': [WEBHOOKS.tpPdforms, ['GET', 'POST']],
    '/api/tp/pdform-action': [WEBHOOKS.tpPdformAction, ['GET', 'POST']]
  };
  if (tpRoutes[pathname]) {
    const [target, methods] = tpRoutes[pathname];
    await proxyRequest(req, res, target, methods);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed', {
      Allow: 'GET, HEAD',
      'Content-Type': 'text/plain; charset=utf-8'
    });
    return;
  }

  await serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`TNreview app running at http://localhost:${PORT}`);
});
