// Release audit for static consent and check-in pages. No network access or HTML execution.
export function auditConsentPage(html, route) {
  const errors = [];
  const head = html.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head>/iu)?.[1] ?? '';
  const body = html.match(/<body(?:\s[^>]*)?>([\s\S]*?)<\/body>/iu)?.[1] ?? '';
  const expectedCanonical = `https://messaging-intel.github.io/${route}`;
  const canonical = head.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/iu)?.[1];
  if (canonical !== expectedCanonical) errors.push(`${route}: incorrect or missing canonical URL`);
  if (!/<title>[^<]+<\/title>/iu.test(head)) errors.push(`${route}: missing title`);
  if (!/<meta\s+name=["']description["'][^>]*content=["'][^"']+["']/iu.test(head)) {
    errors.push(`${route}: missing description`);
  }
  if (!/<meta\s+name=["']referrer["']\s+content=["']no-referrer["']/iu.test(head)) {
    errors.push(`${route}: no-referrer policy is required`);
  }
  const csp = head.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=["']([^"']+)["']/iu)?.[1] ?? '';
  for (const directive of ["default-src 'none'", "connect-src 'none'", "script-src 'none'", "form-action 'none'"]) {
    if (!csp.includes(directive)) errors.push(`${route}: missing restrictive CSP directive ${directive}`);
  }
  if (/<(?:script|form|iframe)(?:\s|>)/iu.test(html)) errors.push(`${route}: active markup is forbidden`);
  if (/\son(?:click|error|load|submit|input|change)\s*=/iu.test(html)) {
    errors.push(`${route}: inline event handlers are forbidden`);
  }
  if (!/<main\s+id=["']main["']/iu.test(body)) errors.push(`${route}: missing accessible main landmark`);
  const ids = [...body.matchAll(/\sid=["']([^"']+)["']/giu)].map((match) => match[1]);
  if (ids.length !== new Set(ids).size) errors.push(`${route}: duplicate fragment targets`);
  for (const [, fragment] of html.matchAll(/href=["']#([^"']+)["']/giu)) {
    if (!ids.includes(fragment)) errors.push(`${route}: unresolved fragment #${fragment}`);
  }
  return errors;
}
