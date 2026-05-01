import { describe, expect, test } from 'bun:test';

const root = new URL('..', import.meta.url);

describe('postinstall script', () => {
  test('uses a Bun script instead of POSIX-only shell redirection', async () => {
    const pkg = await Bun.file(new URL('package.json', root)).json();
    expect(pkg.scripts.postinstall).toBe('bun run scripts/postinstall.ts');

    const postinstall = await Bun.file(new URL('scripts/postinstall.ts', root)).text();
    expect(postinstall).not.toContain('>/dev/null');
    expect(postinstall).not.toContain('1>&2');
    expect(postinstall).toContain('gbrain');
    expect(postinstall).toContain('apply-migrations');
  });
});

describe('compiled binary guards', () => {
  test('accounts for Bun adding .exe to compiled outfiles on Windows', async () => {
    const guard = await Bun.file(new URL('scripts/check-wasm-embedded.sh', root)).text();
    expect(guard).toContain('rm -f "$OUT_BIN" "$OUT_BIN.exe"');
    expect(guard).toContain('if [ -f "$OUT_BIN.exe" ]; then');
    expect(guard).toContain('RUN_BIN="$OUT_BIN.exe"');
    expect(guard).toContain('OUTPUT="$("$RUN_BIN" 2>&1)"');
  });
});

describe('package shell scripts', () => {
  test('runs repo shell guards through bash for Windows Bun compatibility', async () => {
    const pkg = await Bun.file(new URL('package.json', root)).json();
    expect(pkg.scripts.test).toContain('bash scripts/check-privacy.sh');
    expect(pkg.scripts.test).toContain('bash scripts/check-jsonb-pattern.sh');
    expect(pkg.scripts.test).toContain('bash scripts/check-progress-to-stdout.sh');
    expect(pkg.scripts.test).toContain('bash scripts/check-trailing-newline.sh');
    expect(pkg.scripts.test).toContain('bash scripts/check-wasm-embedded.sh');
    expect(pkg.scripts.test).toContain('bash scripts/check-exports-count.sh');
    expect(pkg.scripts['check:jsonb']).toBe('bash scripts/check-jsonb-pattern.sh');
    expect(pkg.scripts['check:privacy']).toBe('bash scripts/check-privacy.sh');
    expect(pkg.scripts['check:progress']).toBe('bash scripts/check-progress-to-stdout.sh');
    expect(pkg.scripts['check:newlines']).toBe('bash scripts/check-trailing-newline.sh');
    expect(pkg.scripts['check:exports-count']).toBe('bash scripts/check-exports-count.sh');
  });
});
