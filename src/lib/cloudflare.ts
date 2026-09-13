import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getCfEnv() {
  const { env } = await getCloudflareContext({ async: true });
  return env as CloudflareEnv;
}
