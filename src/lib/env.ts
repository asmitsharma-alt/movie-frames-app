import { env } from 'cloudflare:workers';

export function getAppEnv(): any {
  try {
    return env || {};
  } catch {
    return {};
  }
}
