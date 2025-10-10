
export interface TokenPair {
  accessToken?: string;
  refreshToken?: string;
  tempToken?: string;
  type?: TokenType;
}

export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  TEMP = 'TEMP',
}
