import { getAuthApiUrl } from "../types/api.types";

type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
  success?: boolean;
};

export class BaseService {
  private static refreshInFlight: Promise<void> | null = null;

  protected getToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  protected getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  protected setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  }

  protected getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  protected handleAuthError(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }

  protected async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = "Request failed";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
          if (text && text.length < 200) {
            errorMessage += ` - ${text}`;
          }
        }
      } catch {
        errorMessage = `Request failed: ${response.status} ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    if (response.status === 204) return undefined as unknown as T;

    throw new Error(`Expected JSON response but received: ${contentType || "unknown"}`);
  }

  protected requireAuth(): void {
    const token = this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }
  }

  private async refreshTokens(): Promise<void> {
    if (BaseService.refreshInFlight) return BaseService.refreshInFlight;

    BaseService.refreshInFlight = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const res = await fetch(getAuthApiUrl("/token/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({refreshToken}),
      });

      if (!res.ok) throw new Error("Refresh failed");


      const data = (await res.json()) as RefreshResponse;
      if (!data.accessToken) throw new Error("No accessToken returned");

      this.setTokens(data.accessToken, data.refreshToken);
    })().finally(() => {
      BaseService.refreshInFlight = null;
    });

    return BaseService.refreshInFlight;
  }

  protected async fetchRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const isRefreshCall = url.includes("/token/refresh");

    const buildOptions = (): RequestInit => {
      const headers = options.headers instanceof Headers
        ? new Headers(options.headers)
        : new Headers(options.headers as HeadersInit | undefined);

      const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

      if (!isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const token = this.getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      return { ...options, headers };
    };

    let response = await fetch(url, buildOptions());

    if (response.status !== 401 || isRefreshCall) return response;

    try {
      await this.refreshTokens();
    } catch {
      this.handleAuthError();
      throw new Error("Session expired");
    }

    response = await fetch(url, buildOptions());

    if (response.status === 401) {
      this.handleAuthError();
      throw new Error("Session expired");
    }

    return response;
  }
}
