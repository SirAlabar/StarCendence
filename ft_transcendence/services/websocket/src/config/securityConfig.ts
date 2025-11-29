// Security configuration
import { getWSConfig } from './wsConfig';

export function getJwtSecret(): string
{
  return getWSConfig().jwtSecret;
}
