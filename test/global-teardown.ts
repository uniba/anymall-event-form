import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export async function teardown() {
  const container = (globalThis as Record<string, unknown>).__TESTCONTAINER__ as
    | StartedPostgreSqlContainer
    | undefined;

  if (container) {
    await container.stop();
  }
}
