/**
 * Layout HTML commun pour tous les emails FitQuest.
 * `content` = bloc HTML interne (entre le séparateur et le footer).
 * `footerNote` = texte optionnel dans le footer (défaut : mention fréquence).
 */
export function buildEmailHtml(content: string, footerNote?: string): string {
  const footer = footerNote ?? 'Fréquence configurable dans <strong style="color:#6366f1">Param&egrave;tres &rsaquo; Compte</strong>';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');</style>
</head>
<body style="margin:0;padding:0;background-color:#0d0f1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f1a;padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0">

    <!-- En-tête -->
    <tr>
      <td style="background-color:#141627;border-radius:16px 16px 0 0;padding:32px 32px 20px;text-align:center;border:1px solid #312e6e;border-bottom:0">
        <img src="cid:fitquest-logo" width="64" height="64" alt="FitQuest" style="display:inline-block"/>
        <h1 style="margin:12px 0 0;font-family:'Orbitron',monospace,sans-serif;font-size:18px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#a78bfa">FitQuest</h1>
      </td>
    </tr>

    <!-- Séparateur -->
    <tr>
      <td style="background-color:#141627;padding:0 32px;border-left:1px solid #312e6e;border-right:1px solid #312e6e">
        <div style="height:1px;background-color:#312e6e"></div>
      </td>
    </tr>

    <!-- Contenu -->
    <tr>
      <td style="background-color:#141627;padding:28px 32px 32px;border-left:1px solid #312e6e;border-right:1px solid #312e6e;font-family:ui-sans-serif,system-ui,sans-serif;color:#e2e8f0">
        ${content}
      </td>
    </tr>

    <!-- Pied de page -->
    <tr>
      <td style="background-color:#0d0b1e;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;border:1px solid #312e6e;border-top:1px solid #312e6e">
        <p style="margin:0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;color:#475569">
          ${footer}
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}
