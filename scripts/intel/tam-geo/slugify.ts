// scripts/intel/tam-geo/slugify.ts
export function slugify(name: string): string {
  return (name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
