export type ExternalSystem = 'hubspot' | 'apollo';

function envBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return raw === '1' || raw.toLowerCase() === 'true';
}

export function shouldBlockExternalWritesInTest(): boolean {
  const isTest = process.env.NODE_ENV === 'test';
  if (!isTest) return false;
  const explicitAllow = envBool('ALLOW_EXTERNAL_WRITES_IN_TEST', false);
  if (explicitAllow) return false;
  return envBool('BLOCK_EXTERNAL_WRITES_IN_TEST', true);
}

export function assertExternalWriteAllowed(system: ExternalSystem, operation: string): void {
  if (!shouldBlockExternalWritesInTest()) return;
  throw new Error(
    `[external-write-guard] blocked ${system} write in test mode: ${operation}. ` +
      'Set ALLOW_EXTERNAL_WRITES_IN_TEST=true only for isolated connector tests.',
  );
}
