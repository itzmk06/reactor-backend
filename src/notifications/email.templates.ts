import { env } from '../lib/env';

const BASE_URL = env.SERVER_URL ?? 'http://localhost:3000';

const BRAND = {
  text: '#000000',
  muted: '#6B7280',
  white: '#FFFFFF',
  surface: '#F8F8F8',
  hairline: '#E5E5E5',
  tagline: '#9CA3AF',
} as const;

const FONT_UI =
  "'Poppins', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', Roboto, Helvetica, Arial, sans-serif";

const LOGO_URL =
  'https://res.cloudinary.com/dxqgyny1x/image/upload/q_auto/f_auto/v1780138228/finalsite_psvgwh.png';

const ARROW_URL =
  'https://cdn-icons-png.flaticon.com/128/3114/3114931.png';

const THEMES = {
  created: {
    accent: '#0891B2',
    text: '#0E7490',
    label: 'New Incident',
    statusValue: 'Open',
  },
  assigned: {
    accent: '#7C3AED',
    text: '#7C3AED',
    label: 'Assigned',
    statusValue: 'Assigned',
  },
  resolved: {
    accent: '#059669',
    text: '#047857',
    label: 'Resolved',
    statusValue: 'Resolved',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeText(input?: string): string {
  return escapeHtml((input ?? '').trim());
}

function safeUsername(username?: string): string {
  const raw = (username ?? '').trim();
  return raw ? escapeHtml(raw) : 'someone';
}

function reactorLogo(): string {
  return `<img src="${LOGO_URL}" style="max-width:120px;width:100%;height:auto;display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" alt="Reactor" />`;
}

function arrowImg(): string {
  return `<img src="${ARROW_URL}" width="20" height="20" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" alt="→" class="arrow-img" />`;
}

function timestamp(): string {
  const now = new Date();
  return now
    .toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(',', ' ·');
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  let trimmed = str.slice(0, maxLen).trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.7) {
    trimmed = trimmed.slice(0, lastSpace);
  }
  return trimmed + '...';
}

function profileUrl(username: string): string {
  return `${BASE_URL}/api/v1/users/u/${encodeURIComponent(username)}`;
}

function incidentUrl(incidentId: string): string {
  return `${BASE_URL}/api/v1/incidents/${encodeURIComponent(incidentId)}`;
}

function baseTemplate(content: string): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">',
    '  <meta http-equiv="X-UA-Compatible" content="IE=edge">',
    '  <meta name="color-scheme" content="light">',
    '  <meta name="supported-color-schemes" content="light">',
    '  <link rel="preconnect" href="https://fonts.googleapis.com">',
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">',
    '  <style>',
    '    html, body { margin:0 !important; padding:0 !important; width:100% !important; height:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }',
    '    body { background:' + BRAND.white + '; font-family:' + FONT_UI + '; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; text-rendering:optimizeLegibility; }',
    '    table { border-collapse:collapse !important; mso-table-lspace:0pt; mso-table-rspace:0pt; }',
    '    img { border:0; outline:none; text-decoration:none; display:block; -ms-interpolation-mode:bicubic; }',
    '    a { color: inherit; }',
    '    .email-wrap { width:100%; background:' + BRAND.white + '; }',
    '    .container { width:100%; }',
    '    .main-padding { padding:64px 48px 32px 48px; }',
    '    .content-padding { padding:48px 48px 0 48px; }',
    '    .footer-padding { padding:40px 48px; }',
    '    .title-size { font-size:42px; line-height:1.12; }',
    '    .stack-col { width:33.33%; }',
    '    .wrap-anywhere { word-break:break-word; overflow-wrap:anywhere; word-wrap:break-word; white-space:normal; }',
    '    @media screen and (max-width: 600px) {',
    '      .main-padding { padding:40px 24px 24px 24px !important; }',
    '      .content-padding { padding:32px 24px 0 24px !important; }',
    '      .footer-padding { padding:32px 24px !important; }',
    '      .title-size { font-size:28px !important; line-height:1.18 !important; letter-spacing:-0.6px !important; }',
    '      .stack-col { display:block !important; width:100% !important; min-width:100% !important; max-width:100% !important; box-sizing:border-box !important; border-right:none !important; border-bottom:1px solid ' + BRAND.hairline + ' !important; padding:20px 16px !important; }',
    '      .stack-col.last { border-bottom:none !important; }',
    '      .mobile-center { text-align:center !important; }',
    '      .mobile-left { text-align:left !important; }',
    '      .mobile-block { display:block !important; width:100% !important; }',
    '      .mobile-mt-12 { margin-top:12px !important; }',
    '      .arrow-img { width:18px !important; height:18px !important; }',
    '    }',
    '  </style>',
    '</head>',
    '<body>',
    '  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-wrap">',
    '    <tr>',
    '      <td>',
    '        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="container">',
    '          <tr>',
    '            <td class="main-padding">',
    '              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '                <tr>',
    '                  <td class="mobile-center" style="vertical-align:middle;">',
    '                    ' + reactorLogo(),
    '                  </td>',
    '                  <td class="mobile-center" style="text-align:right;font-family:' + FONT_UI + ';font-size:12px;color:' + BRAND.tagline + ';font-weight:500;letter-spacing:0.5px;vertical-align:middle;text-transform:uppercase;white-space:nowrap;">',
    '                    ' + timestamp(),
    '                  </td>',
    '                </tr>',
    '              </table>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td style="padding:0 48px;">',
    '              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '                <tr>',
    '                  <td style="border-top:1px solid ' + BRAND.hairline + ';font-size:0;line-height:0;">&nbsp;</td>',
    '                </tr>',
    '              </table>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td class="content-padding">',
    '              ' + content.trim(),
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td>',
    '              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ' + BRAND.hairline + ';">',
    '                <tr>',
    '                  <td class="footer-padding">',
    '                    <p style="margin:0;font-family:' + FONT_UI + ';font-size:13px;color:' + BRAND.text + ';line-height:1.6;" class="wrap-anywhere">',
    '                      <strong style="font-weight:600;">You\'re receiving this because</strong><br>',
    '                      <span style="color:' + BRAND.muted + '">you are part of the on-call team.</span>',
    '                    </p>',
    '                  </td>',
    '                </tr>',
    '              </table>',
    '            </td>',
    '          </tr>',
    '        </table>',
    '      </td>',
    '    </tr>',
    '  </table>',
    '</body>',
    '</html>',
  ].join('\n');
}

function buildContent(
  data: {
    incidentId: string;
    title: string;
    severity: string;
    creatorUsername?: string;
    assignedByUsername?: string;
    assigneeUsername?: string;
    resolvedByUsername?: string;
    description?: string;
  },
  themeKey: ThemeKey,
  url: string
): string {
  const t = THEMES[themeKey];

  let rawDesc = (data.description ?? '').trim();
  if (!rawDesc) {
    const defaults: Record<ThemeKey, string> = {
      created:
        'A new incident has been reported and requires immediate attention. Please review the details and take necessary action.',
      assigned:
        `${data.assignedByUsername ?? 'someone'} has assigned this incident to you. Please investigate and update the status as soon as possible.`,
      resolved:
        'Great work! This incident has been successfully resolved and marked as closed. No further action is required.',
    };
    rawDesc = defaults[themeKey];
  }

  const desc = truncate(rawDesc, 220);

  let meta: string;
  if (themeKey === 'created') {
    const username = safeUsername(data.creatorUsername);
    meta =
      'Created by <a href="' +
      profileUrl(data.creatorUsername ?? '') +
      '" style="color:' +
      BRAND.text +
      ';font-weight:600;text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">@' +
      username +
      '</a>';
  } else if (themeKey === 'assigned') {
    const username = safeUsername(data.assignedByUsername);
    meta =
      'Assigned by <a href="' +
      profileUrl(data.assignedByUsername ?? '') +
      '" style="color:' +
      BRAND.text +
      ';font-weight:600;text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">@' +
      username +
      '</a>';
  } else {
    const username = safeUsername(data.resolvedByUsername);
    meta =
      'Resolved by <a href="' +
      profileUrl(data.resolvedByUsername ?? '') +
      '" style="color:' +
      BRAND.text +
      ';font-weight:600;text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">@' +
      username +
      '</a>';
  }

  const incidentId = data.incidentId.toUpperCase().startsWith('INC-')
    ? data.incidentId.toUpperCase()
    : 'INC-' + data.incidentId.toUpperCase();

  const safeTitle = safeText(truncate(data.title.trim(), 120));
  const safeSeverity = safeText(data.severity);
  const safeDesc = safeText(desc);
  const safeIncidentId = escapeHtml(incidentId);

  return [
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0;table-layout:fixed;">',
    '  <tr>',
    '    <td style="font-family:' + FONT_UI + ';font-size:12px;font-weight:600;color:' + t.text + ';letter-spacing:2px;text-transform:uppercase;mso-line-height-rule:exactly;" class="wrap-anywhere">',
    '      ' + t.label,
    '    </td>',
    '  </tr>',
    '  <tr>',
    '    <td style="padding-top:10px;">',
    '      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="28">',
    '        <tr><td style="border-top:2px solid ' + t.accent + ';font-size:0;line-height:0;">&nbsp;</td></tr>',
    '      </table>',
    '    </td>',
    '  </tr>',
    '</table>',

    '<h1 class="title-size wrap-anywhere" style="margin:0 0 22px 0;font-family:' + FONT_UI + ';font-size:42px;font-weight:700;color:' + BRAND.text + ';letter-spacing:-1.2px;line-height:1.1;mso-line-height-rule:exactly;word-break:break-word;overflow-wrap:anywhere;">',
    '  ' + safeTitle,
    '</h1>',

    '<p class="wrap-anywhere" style="margin:0 0 32px 0;font-family:' + FONT_UI + ';font-size:15px;color:' + BRAND.muted + ';line-height:1.6;word-break:break-word;overflow-wrap:anywhere;">',
    '  ' + meta,
    '</p>',

    '<p class="wrap-anywhere" style="margin:0 0 40px 0;font-family:' + FONT_UI + ';font-size:16px;color:' + BRAND.muted + ';line-height:1.7;letter-spacing:-0.1px;word-break:break-word;overflow-wrap:anywhere;">',
    '  ' + safeDesc,
    '</p>',

    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 40px 0;background:' + BRAND.surface + ';border:1px solid ' + BRAND.hairline + ';border-radius:2px;table-layout:fixed;">',
    '  <tr>',
    '    <td style="padding:0;">',
    '      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout:fixed;">',
    '        <tr>',
    '          <td class="stack-col" width="33.33%" align="center" style="border-right:1px solid ' + BRAND.hairline + ';padding:28px 16px;">',
    '            <p style="margin:0 0 8px 0;font-family:' + FONT_UI + ';font-size:10px;font-weight:600;color:' + BRAND.tagline + ';letter-spacing:1px;text-transform:uppercase;">Status</p>',
    '            <p class="wrap-anywhere" style="margin:0;font-family:' + FONT_UI + ';font-size:14px;font-weight:600;color:' + t.text + ';word-break:break-word;overflow-wrap:anywhere;">' + escapeHtml(t.statusValue) + '</p>',
    '          </td>',
    '          <td class="stack-col" width="33.33%" align="center" style="border-right:1px solid ' + BRAND.hairline + ';padding:28px 16px;">',
    '            <p style="margin:0 0 8px 0;font-family:' + FONT_UI + ';font-size:10px;font-weight:600;color:' + BRAND.tagline + ';letter-spacing:1px;text-transform:uppercase;">Severity</p>',
    '            <p class="wrap-anywhere" style="margin:0;font-family:' + FONT_UI + ';font-size:14px;font-weight:600;color:' + BRAND.text + ';word-break:break-word;overflow-wrap:anywhere;">' + safeSeverity + '</p>',
    '          </td>',
    '          <td class="stack-col last" width="33.33%" align="center" style="padding:28px 16px;">',
    '            <p style="margin:0 0 8px 0;font-family:' + FONT_UI + ';font-size:10px;font-weight:600;color:' + BRAND.tagline + ';letter-spacing:1px;text-transform:uppercase;">Incident ID</p>',
    '            <p class="wrap-anywhere" style="margin:0;font-family:' + FONT_UI + ';font-size:14px;font-weight:600;color:' + BRAND.text + ';word-break:break-word;overflow-wrap:anywhere;">' + safeIncidentId + '</p>',
    '          </td>',
    '        </tr>',
    '      </table>',
    '    </td>',
    '  </tr>',
    '</table>',

    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;table-layout:fixed;">',
    '  <tr>',
    '    <td style="padding-right:14px;vertical-align:middle;">',
    '      ' + arrowImg(),
    '    </td>',
    '    <td style="vertical-align:middle;">',
    '      <a href="' + url + '" style="font-family:' + FONT_UI + ';font-size:13px;font-weight:600;color:' + BRAND.text + ';text-decoration:none;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid ' + BRAND.text + ';padding-bottom:4px;display:inline-block;word-break:break-word;overflow-wrap:anywhere;">',
    '        View Incident',
    '      </a>',
    '    </td>',
    '  </tr>',
    '</table>',
  ].join('\n');
}

export function incidentCreatedTemplate(data: {
  incidentId: string;
  title: string;
  severity: string;
  creatorUsername: string;
  description?: string;
}): { subject: string; html: string } {
  const url = incidentUrl(data.incidentId);
  return {
    subject: `[${data.severity}] New Incident: ${data.title}`,
    html: baseTemplate(buildContent(data, 'created', url)),
  };
}

export function incidentAssignedTemplate(data: {
  incidentId: string;
  title: string;
  severity: string;
  assigneeUsername: string;
  assignedByUsername: string;
  description?: string;
}): { subject: string; html: string } {
  const url = incidentUrl(data.incidentId);
  return {
    subject: `Assigned to you: ${data.title}`,
    html: baseTemplate(buildContent(data, 'assigned', url)),
  };
}

export function incidentResolvedTemplate(data: {
  incidentId: string;
  title: string;
  severity: string;
  resolvedByUsername: string;
  description?: string;
}): { subject: string; html: string } {
  const url = incidentUrl(data.incidentId);
  return {
    subject: `Resolved: ${data.title}`,
    html: baseTemplate(buildContent(data, 'resolved', url)),
  };
}