describe('db', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    // Clear global prisma
    delete (globalThis as any).prisma;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should export a prisma client instance', async () => {
    const { prisma } = await import('./db');

    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe('object');
  });

  it('should reuse the same instance (singleton pattern) in development', async () => {
    process.env.NODE_ENV = 'development';

    // First import
    const { prisma: prisma1 } = await import('./db');

    // Reset modules but keep global
    jest.resetModules();

    // Second import should get same instance from global
    const { prisma: prisma2 } = await import('./db');

    expect(prisma1).toBe(prisma2);
  });

  it('should store instance in global in non-production', async () => {
    process.env.NODE_ENV = 'development';

    await import('./db');

    expect((globalThis as any).prisma).toBeDefined();
  });
});
