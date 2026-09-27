export interface VCardConfig {
  name: string;
  phone?: string;
  email?: string;
  organization?: string;
  title?: string;
  url?: string;
}

export function buildVCardString(config: VCardConfig): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (config.name) lines.push(`FN:${config.name}`);
  if (config.phone) lines.push(`TEL:${config.phone}`);
  if (config.email) lines.push(`EMAIL:${config.email}`);
  if (config.organization) lines.push(`ORG:${config.organization}`);
  if (config.title) lines.push(`TITLE:${config.title}`);
  if (config.url) lines.push(`URL:${config.url}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}
