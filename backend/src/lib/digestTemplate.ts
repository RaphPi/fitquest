import { buildEmailHtml } from './emailTemplate';
import type { DigestData } from './digestData';

function tile(value: string | number, label: string, color: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="background-color:#1a1b3e;border:1px solid #312e6e;border-radius:8px;padding:16px 8px;text-align:center">
          <div style="font-family:'Orbitron',monospace,sans-serif;font-size:26px;font-weight:900;color:${color};line-height:1">${value}</div>
          <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:6px">${label}</div>
        </td>
      </tr>
    </table>`;
}

function sectionTitle(text: string): string {
  return `<p style="margin:0 0 12px;font-family:'Orbitron',monospace,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a78bfa">${text}</p>`;
}

function divider(): string {
  return `<div style="height:1px;background-color:#312e6e;margin:20px 0"></div>`;
}

export function buildDigestHtml(data: DigestData): string {
  const { period, workouts, totalSets, streak, xpGained, topExercises, badgesEarned } = data;

  // Bannière période
  const banner = `
    <p style="margin:0 0 4px;font-family:'Orbitron',monospace,sans-serif;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#a78bfa;text-align:center">Rapport de progression</p>
    <p style="margin:0;font-size:13px;color:#64748b;text-align:center">${period.label}</p>
    ${divider()}`;

  // Tuiles stats 2×2
  const stats = `
    ${sectionTitle('Stats de la p&eacute;riode')}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td width="50%" valign="top" style="padding:0 5px 10px 0">${tile(workouts, 'S&eacute;ances', '#6366f1')}</td>
        <td width="50%" valign="top" style="padding:0 0 10px 5px">${tile(totalSets, 'S&eacute;ries', '#22d3ee')}</td>
      </tr>
      <tr>
        <td width="50%" valign="top" style="padding:0 5px 0 0">${tile(streak, 'Streak', '#f59e0b')}</td>
        <td width="50%" valign="top" style="padding:0 0 0 5px">${tile(`+${xpGained}`, 'XP gagn&eacute;s', '#4ade80')}</td>
      </tr>
    </table>`;

  // Top exercices
  let exercisesBlock = '';
  if (topExercises.length > 0) {
    const rows = topExercises.map((ex, i) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #1e293b">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="font-size:13px;color:#e2e8f0">
                <span style="color:#6366f1;font-weight:700">#${i + 1}</span>&nbsp;&nbsp;${ex.name}
              </td>
              <td style="text-align:right;font-size:12px;color:#64748b;white-space:nowrap">
                ${ex.count} s&eacute;rie${ex.count > 1 ? 's' : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join('');

    exercisesBlock = `
      ${divider()}
      ${sectionTitle('Top exercices')}
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${rows}
      </table>`;
  }

  // Badges débloqués
  let badgesBlock = '';
  if (badgesEarned.length > 0) {
    const items = badgesEarned.map((b) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #1e293b">
          <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#f59e0b">&#x1F3C6; ${b.name}</p>
          <p style="margin:0;font-size:12px;color:#64748b">${b.description}</p>
        </td>
      </tr>`).join('');

    badgesBlock = `
      ${divider()}
      ${sectionTitle('Badges d&eacute;bloqu&eacute;s')}
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${items}
      </table>`;
  } else {
    badgesBlock = `
      ${divider()}
      ${sectionTitle('Badges d&eacute;bloqu&eacute;s')}
      <p style="margin:0;font-size:13px;color:#64748b;text-align:center;padding:12px 0">Continuez vos efforts&nbsp;&mdash; les prochains badges vous attendent&nbsp;!</p>`;
  }

  const content = banner + stats + exercisesBlock + badgesBlock;
  return buildEmailHtml(
    content,
    'Digest FitQuest &middot; Fr&eacute;quence configurable dans <strong style="color:#6366f1">Param&egrave;tres &rsaquo; Compte</strong>',
  );
}
