import { env } from '../lib/env';

const BASE_URL = env.CLIENT_URL ?? 'http://localhost:5173';

const CREATED_THEME = {
  sidebar: '#A5F3FC',
  pastel: '#ECFEFF',
  pastelDeep: '#CFFAFE',
  text: '#0E7490',
  accent: '#0891B2',
  button: '#0891B2',
};

const ASSIGNED_THEME = {
  sidebar: '#DDD6FE',
  pastel: '#F5F3FF',
  pastelDeep: '#EDE9FE',
  text: '#7C3AED',
  accent: '#7C3AED',
  button: '#7C3AED',
};

const RESOLVED_THEME = {
  sidebar: '#A7F3D0',
  pastel: '#ECFDF5',
  pastelDeep: '#D1FAE5',
  text: '#047857',
  accent: '#059669',
  button: '#059669',
};

const BRAND = {
  deep: '#000000',
  text: '#000000',
  muted: '#6B7280',
  light: '#FAFAFA',
  white: '#FFFFFF',
  surface: '#F8F8F8',
  hairline: '#E5E5E5',
  tagline: '#9CA3AF',
};

const FONT_BRAND = "'Marck Script', cursive";
const FONT_UI = "'Poppins', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', Roboto, Helvetica, Arial, sans-serif";

function reactorLogo(): string {
  return `<img src="https://res.cloudinary.com/dxqgyny1x/image/upload/q_auto/f_auto/v1780138228/finalsite_psvgwh.png" style="max-width:140px;width:100%;height:auto;display:block;" alt="Reactor" />`;
}

function actionButton(href: string, text: string, color: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:40px 0 0 0;">
      <tr>
        <td style="border-radius:4px;background:${color};border:1px solid ${color};" align="center">
          <a href="${href}" style="display:inline-block;padding:14px 32px;font-family:${FONT_UI};font-size:11px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:1.2px;text-transform:uppercase;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
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

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  let trimmed = str.slice(0, maxLen).trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.7) {
    trimmed = trimmed.slice(0, lastSpace);
  }
  return trimmed + '...';
}

function readMoreLink(url: string): string {
  return ' <a href="' + url + '" style="color:' + BRAND.muted + ';text-decoration:none;font-weight:500;white-space:nowrap;border-bottom:1px solid ' + BRAND.hairline + ';padding-bottom:1px;">read more</a>';
}

function baseTemplate(
  content: string,
  sidebarColor: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Marck+Script:wght@400;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        @media screen and (max-width: 600px) {
          .main-padding { padding: 40px 28px !important; }
          .title-size { font-size: 18px !important; letter-spacing: -0.5px !important; }
          .meta-size { font-size: 12px !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background:${BRAND.white};font-family:${FONT_UI};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;min-width:100%;background:${BRAND.white};">
        <tr>
          <td align="left" style="padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;min-width:100%;background:${BRAND.white};">
              <tr>
                <td style="padding:0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td class="main-padding" style="padding:56px 48px 48px 48px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 40px 0;border-bottom:1px solid ${BRAND.hairline};padding-bottom:24px;">
                          <tr>
                            <td>
                              ${reactorLogo()}
                            </td>
                            <td align="right" valign="top" style="font-family:${FONT_UI};font-size:11px;color:${BRAND.tagline};font-weight:500;letter-spacing:0.5px;vertical-align:top;mso-line-height-rule:exactly;text-transform:uppercase;">
                              ${timestamp()}
                            </td>
                          </tr>
                        </table>
                        
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="width:3px;background:${sidebarColor};padding:0;font-size:0;line-height:0;" width="3">&nbsp;</td>
                            <td style="padding:0 0 0 32px;">
                              ${content}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${BRAND.hairline};">
                    <tr>
                      <td style="padding:24px 48px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="font-family:${FONT_UI};font-size:11px;color:${BRAND.tagline};line-height:1.6;letter-spacing:0.3px;text-transform:uppercase;font-weight:500;">
                              You received this because you are part of the on-call team.
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
  description?: string;
}): { subject: string; html: string } {
  const t = CREATED_THEME;
  const url = `${BASE_URL}/incidents/${data.incidentId}`;
  const rawDesc = data.description && data.description.trim().length > 0
    ? data.description
    : 'A new incident has been reported and requires immediate attention. Please review the details and take necessary action.';
  const desc = truncate(rawDesc, 180) + readMoreLink(url);

  const content = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
      <tr>
        <td style="border-radius:4px;background:${t.pastelDeep};padding:6px 14px;font-family:${FONT_UI};font-size:11px;font-weight:800;color:${t.text};line-height:1;letter-spacing:0.5px;text-transform:uppercase;mso-line-height-rule:exactly;">
          ${data.severity} — New Incident
        </td>
      </tr>
    </table>
    <h1 class="title-size" style="margin:0 0 16px 0;font-family:${FONT_UI};font-size:20px;font-weight:600;color:${BRAND.text};letter-spacing:-0.6px;line-height:1.25;mso-line-height-rule:exactly;">
      ${data.title}
    </h1>
    <p class="meta-size" style="margin:0 0 24px 0;font-family:${FONT_UI};font-size:13px;color:${BRAND.muted};line-height:1.5;letter-spacing:0.2px;">
      <strong style="color:${BRAND.text};font-weight:600;">Created by ${data.creatorName}</strong>
    </p>
    <p style="margin:0;font-family:${FONT_UI};font-size:14px;color:${BRAND.muted};line-height:1.7;letter-spacing:0;">
      ${desc}
    </p>
    ${actionButton(url, 'View Incident', t.button)}
  `;

  return {
    subject: `[${data.severity}] New Incident: ${data.title}`,
    html: baseTemplate(content, t.accent),
  };
}

export function incidentAssignedTemplate(data: {
  incidentId: string;
  title: string;
  severity: string;
  assigneeName: string;
  assignedByName: string;
  description?: string;
}): { subject: string; html: string } {
  const t = ASSIGNED_THEME;
  const url = `${BASE_URL}/incidents/${data.incidentId}`;
  const rawDesc = data.description && data.description.trim().length > 0
    ? data.description
    : `${data.assignedByName} has assigned this incident to you. Please investigate and update the status as soon as possible.`;
  const desc = truncate(rawDesc, 180) + readMoreLink(url);

  const content = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
      <tr>
        <td style="border-radius:4px;background:${t.pastelDeep};padding:6px 14px;font-family:${FONT_UI};font-size:11px;font-weight:800;color:${t.text};line-height:1;letter-spacing:0.5px;text-transform:uppercase;mso-line-height-rule:exactly;">
          ${data.severity} — Assigned to You
        </td>
      </tr>
    </table>
    <h1 class="title-size" style="margin:0 0 16px 0;font-family:${FONT_UI};font-size:20px;font-weight:600;color:${BRAND.text};letter-spacing:-0.6px;line-height:1.25;mso-line-height-rule:exactly;">
      ${data.title}
    </h1>
    <p class="meta-size" style="margin:0 0 24px 0;font-family:${FONT_UI};font-size:13px;color:${BRAND.muted};line-height:1.5;letter-spacing:0.2px;">
      <strong style="color:${BRAND.text};font-weight:600;">Assigned by ${data.assignedByName}</strong>
    </p>
    <p style="margin:0;font-family:${FONT_UI};font-size:14px;color:${BRAND.muted};line-height:1.7;letter-spacing:0;">
      ${desc}
    </p>
    ${actionButton(url, 'View Incident', t.button)}
  `;

  return {
    subject: `Assigned to you: ${data.title}`,
    html: baseTemplate(content, t.accent),
  };
}

export function incidentResolvedTemplate(data: {
  incidentId: string;
  title: string;
  severity: string;
  resolvedByName: string;
  description?: string;
}): { subject: string; html: string } {
  const t = RESOLVED_THEME;
  const url = `${BASE_URL}/incidents/${data.incidentId}`;
  const rawDesc = data.description && data.description.trim().length > 0
    ? data.description
    : 'Great work! This incident has been successfully resolved and marked as closed. No further action is required.';
  const desc = truncate(rawDesc, 180) + readMoreLink(url);

  const content = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
      <tr>
        <td style="border-radius:4px;background:${t.pastelDeep};padding:6px 14px;font-family:${FONT_UI};font-size:11px;font-weight:800;color:${t.text};line-height:1;letter-spacing:0.5px;text-transform:uppercase;mso-line-height-rule:exactly;">
          Resolved
        </td>
      </tr>
    </table>
    <h1 class="title-size" style="margin:0 0 16px 0;font-family:${FONT_UI};font-size:20px;font-weight:600;color:${BRAND.text};letter-spacing:-0.6px;line-height:1.25;mso-line-height-rule:exactly;">
      ${data.title}
    </h1>
    <p class="meta-size" style="margin:0 0 24px 0;font-family:${FONT_UI};font-size:13px;color:${BRAND.muted};line-height:1.5;letter-spacing:0.2px;">
      <strong style="color:${BRAND.text};font-weight:600;">Resolved by ${data.resolvedByName}</strong>
    </p>
    <p style="margin:0;font-family:${FONT_UI};font-size:14px;color:${BRAND.muted};line-height:1.7;letter-spacing:0;">
      ${desc}
    </p>
    ${actionButton(url, 'View Incident', t.button)}
  `;

  return {
    subject: `Resolved: ${data.title}`,
    html: baseTemplate(content, t.accent),
  };
}