/** A CRM name typed all lowercase ("michelle schlie") is said the way a person writes it; any other casing is kept. */
export const displayName = (n: string) => (n && n === n.toLowerCase() ? n.replace(/(^|[\s'-])([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase()) : n);
