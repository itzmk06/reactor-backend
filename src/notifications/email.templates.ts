import { env } from '../lib/env';

const BASE_URL = env.CLIENT_URL ?? 'http://localhost:5173';

const CREATED_THEME = {
  sidebar: '#A5F3FC',
  pastel: '#ECFEFF',
  pastelDeep: '#CFFAFE',
  text: '#0E7490',
  accent: '#0891B2',
  dot: '#06B6D4',
  avatarBg: '#ECFEFF',
  button: '#0891B2',
};

const ASSIGNED_THEME = {
  sidebar: '#DDD6FE',
  pastel: '#F5F3FF',
  pastelDeep: '#EDE9FE',
  text: '#7C3AED',
  accent: '#7C3AED',
  dot: '#8B5CF6',
  avatarBg: '#F5F3FF',
  button: '#7C3AED',
};

const RESOLVED_THEME = {
  sidebar: '#A7F3D0',
  pastel: '#ECFDF5',
  pastelDeep: '#D1FAE5',
  text: '#047857',
  accent: '#059669',
  dot: '#10B981',
  avatarBg: '#ECFDF5',
  button: '#059669',
};

const BRAND = {
  deep: '#111111',
  text: '#0F172A',
  muted: '#64748B',
  light: '#FAFAFA',
  white: '#FFFFFF',
  surface: '#F8F8F6',
  hairline: '#E8E8E6',
  tagline: '#9CA3AF',
};

const FONT_BRAND = "'Macondo', 'Brush Script MT', cursive";
const FONT_UI =
  "'Syne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function avatar(name: string, color: string, bg: string): string {
  const ini = initials(name);
  return `<div style="display:inline-block;width:44px;height:44px;border-radius:50%;background:${bg};color:${color};font-size:14px;font-weight:700;line-height:44px;text-align:center;font-family:${FONT_UI};border:2px solid ${color}20;">${ini}</div>`;
}

function actionButton(href: string, text: string, color: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0 0;">
      <tr>
        <td style="border-radius:10px;background:${color};" align="center">
          <a href="${href}" style="display:inline-block;padding:14px 32px;font-family:${FONT_UI};font-size:13px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;letter-spacing:0.5px;text-transform:uppercase;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function metaItem(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;font-family:${FONT_UI};font-size:10px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:1.2px;font-weight:600;">
        ${label}
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 18px 0;font-family:${FONT_UI};font-size:14px;color:${BRAND.text};font-weight:700;letter-spacing:-0.2px;">
        ${value}
      </td>
    </tr>
  `;
}

function timestamp(): string {
  const now = new Date();
  return now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function reactorLogo(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="font-family:${FONT_BRAND};font-size:46px;color:${BRAND.deep};line-height:1;letter-spacing:-2px;text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased;">
          Reactor
        </td>
      </tr>
      <tr>
        <td style="padding-top:4px;font-family:${FONT_UI};font-size:9px;font-weight:700;letter-spacing:4.5px;text-transform:uppercase;color:${BRAND.tagline};">
          INCIDENT COMMAND CENTER
        </td>
      </tr>
    </table>
  `;
}

function baseTemplate(content: string, sidebarColor: string, footerBg: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <link href="https://fonts.googleapis.com/css2?family=Macondo&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin:0;padding:0;background:${BRAND.surface};font-family:${FONT_UI};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.surface};">
        <tr>
          <td align="center" style="padding:48px 16px;">

            <!-- Main Card with Sidebar -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;border-radius:0;background:${BRAND.white};overflow:hidden;">

              <tr>
                <!-- Left Sidebar (colored strip) -->
                <td width="10" style="background:${sidebarColor};font-size:0;line-height:0;">&nbsp;</td>

                <!-- Content Area -->
                <td style="padding:0;">

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:36px 32px 32px 32px;">

                        <!-- Header -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px 0;">
                          <tr>
                            <td>
                              ${reactorLogo()}
                            </td>
                            <td align="right" valign="top" style="font-family:${FONT_UI};font-size:11px;color:#94A3B8;font-weight:500;letter-spacing:0.2px;vertical-align:top;">
                              ${timestamp()}
                            </td>
                          </tr>
                        </table>

                        <!-- Hairline -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px 0;">
                          <tr><td style="height:1px;background:${BRAND.hairline};font-size:0;line-height:0;">&nbsp;</td></tr>
                        </table>

                        ${content}

                      </td>
                    </tr>
                  </table>

                  <!-- Footer -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${footerBg};border-top:1px solid ${BRAND.hairline};">
                    <tr>
                      <td style="padding:20px 32px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="font-family:${FONT_UI};font-size:11px;color:#94A3B8;line-height:1.6;letter-spacing:0.1px;">
                              You received this because you are part of the on-call team.
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top:6px;font-family:${FONT_BRAND};font-size:18px;color:#D1D5DB;line-height:1;">
                              Reactor
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}

export function incidentCreatedTemplate(data: {
  incidentId: string;
  title: string;
  severity: string;
  creatorName: string;
}): { subject: string; html: string } {
  const t = CREATED_THEME;
  const url = `${BASE_URL}/incidents/${data.incidentId}`;

  const content = `
    <!-- Status Block -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${t.pastelDeep};border-radius:10px;padding:14px 18px;margin:0 0 24px 0;">
      <tr>
        <td style="font-family:${FONT_UI};font-size:11px;font-weight:800;color:${t.text};line-height:1;letter-spacing:0.5px;">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${t.dot};margin-right:10px;vertical-align:middle;"></span>
          ${data.severity} — NEW INCIDENT
        </td>
      </tr>
    </table>

    <!-- Two Column -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td width="130" style="vertical-align:top;padding-right:20px;border-right:1px solid ${BRAND.hairline};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${metaItem('Incident', `#${data.incidentId}`)}
            ${metaItem('Severity', data.severity)}
            ${metaItem('Status', 'Investigating')}
          </table>
        </td>
        <td style="vertical-align:top;padding-left:24px;">
          <h1 style="margin:0 0 14px 0;font-family:${FONT_UI};font-size:22px;font-weight:800;color:${BRAND.text};letter-spacing:-0.5px;line-height:1.3;">
            ${data.title}
          </h1>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;">
                ${avatar(data.creatorName, t.accent, t.avatarBg)}
              </td>
              <td style="vertical-align:middle;font-family:${FONT_UI};font-size:14px;color:${BRAND.muted};line-height:1.4;">
                Created by <strong style="color:${BRAND.text};font-weight:700;">${data.creatorName}</strong>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px 0;font-family:${FONT_UI};font-size:15px;color:${BRAND.muted};line-height:1.7;letter-spacing:-0.1px;">
            A new incident has been reported and requires immediate attention. Please review the details and take necessary action.
          </p>
          ${actionButton(url, 'View Incident', t.button)}
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `[${data.severity}] New Incident: ${data.title}`,
    html: baseTemplate(content, t.sidebar, t.pastel),
  };
}

export function incidentAssignedTemplate(data: {
  incidentId: string;
  title: string;
  severity: string;
  assigneeName: string;
  assignedByName: string;
}): { subject: string; html: string } {
  const t = ASSIGNED_THEME;
  const url = `${BASE_URL}/incidents/${data.incidentId}`;

  const content = `
    <!-- Status Block -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${t.pastelDeep};border-radius:10px;padding:14px 18px;margin:0 0 24px 0;">
      <tr>
        <td style="font-family:${FONT_UI};font-size:11px;font-weight:800;color:${t.text};line-height:1;letter-spacing:0.5px;">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${t.dot};margin-right:10px;vertical-align:middle;"></span>
          ${data.severity} — ASSIGNED TO YOU
        </td>
      </tr>
    </table>

    <!-- Two Column -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td width="130" style="vertical-align:top;padding-right:20px;border-right:1px solid ${BRAND.hairline};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${metaItem('Incident', `#${data.incidentId}`)}
            ${metaItem('Severity', data.severity)}
            ${metaItem('Assigned by', data.assignedByName)}
          </table>
        </td>
        <td style="vertical-align:top;padding-left:24px;">
          <h1 style="margin:0 0 14px 0;font-family:${FONT_UI};font-size:22px;font-weight:800;color:${BRAND.text};letter-spacing:-0.5px;line-height:1.3;">
            ${data.title}
          </h1>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;">
                ${avatar(data.assigneeName, t.accent, t.avatarBg)}
              </td>
              <td style="vertical-align:middle;font-family:${FONT_UI};font-size:14px;color:${BRAND.muted};line-height:1.4;">
                Hey <strong style="color:${BRAND.text};font-weight:700;">${data.assigneeName}</strong>, this one is yours now.
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px 0;font-family:${FONT_UI};font-size:15px;color:${BRAND.muted};line-height:1.7;letter-spacing:-0.1px;">
            <strong style="color:${BRAND.text};font-weight:700;">${data.assignedByName}</strong> has assigned this incident to you. Please investigate and update the status as soon as possible.
          </p>
          ${actionButton(url, 'View Incident', t.button)}
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Assigned to you: ${data.title}`,
    html: baseTemplate(content, t.sidebar, t.pastel),
  };
}

export function incidentResolvedTemplate(data: {
  incidentId: string;
  title: string;
  severity: string;
  resolvedByName: string;
}): { subject: string; html: string } {
  const t = RESOLVED_THEME;
  const url = `${BASE_URL}/incidents/${data.incidentId}`;

  const content = `
    <!-- Status Block -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${t.pastelDeep};border-radius:10px;padding:14px 18px;margin:0 0 24px 0;">
      <tr>
        <td style="font-family:${FONT_UI};font-size:11px;font-weight:800;color:${t.text};line-height:1;letter-spacing:0.5px;">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${t.dot};margin-right:10px;vertical-align:middle;"></span>
          RESOLVED
        </td>
      </tr>
    </table>

    <!-- Two Column -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td width="130" style="vertical-align:top;padding-right:20px;border-right:1px solid ${BRAND.hairline};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${metaItem('Incident', `#${data.incidentId}`)}
            ${metaItem('Severity', data.severity)}
            ${metaItem('Status', `<span style="color:${t.accent};">Resolved</span>`)}
          </table>
        </td>
        <td style="vertical-align:top;padding-left:24px;">
          <h1 style="margin:0 0 14px 0;font-family:${FONT_UI};font-size:22px;font-weight:800;color:${BRAND.text};letter-spacing:-0.5px;line-height:1.3;">
            ${data.title}
          </h1>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;">
                ${avatar(data.resolvedByName, t.accent, t.avatarBg)}
              </td>
              <td style="vertical-align:middle;font-family:${FONT_UI};font-size:14px;color:${BRAND.muted};line-height:1.4;">
                Resolved by <strong style="color:${BRAND.text};font-weight:700;">${data.resolvedByName}</strong>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px 0;font-family:${FONT_UI};font-size:15px;color:${BRAND.muted};line-height:1.7;letter-spacing:-0.1px;">
            Great work! This incident has been successfully resolved and marked as closed. No further action is required.
          </p>
          ${actionButton(url, 'View Incident', t.button)}
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Resolved: ${data.title}`,
    html: baseTemplate(content, t.sidebar, t.pastel),
  };
}
