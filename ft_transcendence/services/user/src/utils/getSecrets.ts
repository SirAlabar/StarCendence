import { readFileSync } from 'fs';
import { HttpError } from './HttpError';


// Get Metrics User from Docker secret
export function getMetricsUser(): string {
  const metricsUser: string = readFileSync('/run/secrets/metrics_user', 'utf8').trim();
  if (!metricsUser) {
    throw new HttpError('Metrics User is not configured', 500);
  }
  return metricsUser;
}

// Get Metrics Password from Docker secret
export function getMetricsPass(): string {
  const metricsPass: string = readFileSync('/run/secrets/metrics_pass', 'utf8').trim();
  if (!metricsPass) {
    throw new HttpError('Metrics Password is not configured', 500);
  }
  return metricsPass;
}

// Get internal API key from Docker secret
export function getInternalApiKey(): string {
	const apiKey: string = readFileSync('/run/secrets/internal_api_key', 'utf8').trim();
	if (!apiKey) {
		throw new HttpError('Internal API key is not configured', 500);
	}
  return apiKey;
}