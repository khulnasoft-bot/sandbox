import { describe, test, expect, vi, beforeEach } from "vitest";
import * as cmd from "cmd-ts";
import {
  AccessTokenMissingError,
  RefreshAccessTokenFailedError,
} from "@khulnasoft/oidc";

const { mockGetAuth, mockGetKhulnasoftCliToken, mockGetKhulnasoftOidcToken, mockLogin } =
  vi.hoisted(() => ({
    mockGetAuth: vi.fn(),
    mockGetKhulnasoftCliToken: vi.fn(),
    mockGetKhulnasoftOidcToken: vi.fn(),
    mockLogin: vi.fn(),
  }));

vi.mock("@khulnasoft/oidc", async () => {
  const actual = await vi.importActual<typeof import("@khulnasoft/oidc")>(
    "@khulnasoft/oidc",
  );
  return {
    ...actual,
    getKhulnasoftToken: mockGetKhulnasoftCliToken,
    getKhulnasoftOidcToken: mockGetKhulnasoftOidcToken,
  };
});

vi.mock("../../src/commands/login", () => ({
  login: { handler: mockLogin },
}));

vi.mock("@khulnasoft/sandbox/dist/auth/index.js", async () => {
  const actual = await vi.importActual<
    typeof import("@khulnasoft/sandbox/dist/auth/index.js")
  >("@khulnasoft/sandbox/dist/auth/index.js");
  return { ...actual, getAuth: mockGetAuth };
});

describe("token", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockGetAuth.mockReturnValue(null);

    // Clear relevant env vars
    delete process.env.KHULNASOFT_AUTH_TOKEN;
    delete process.env.KHULNASOFT_OIDC_TOKEN;
  });

  describe("environment variable fallbacks", () => {
    test("uses KHULNASOFT_AUTH_TOKEN when set", async () => {
      process.env.KHULNASOFT_AUTH_TOKEN = "env-auth-token";

      const { token } = await import("../../src/args/auth.ts");

      const command = cmd.command({
        name: "test",
        args: { token },
        handler: (args) => args,
      });

      const result = await cmd.run(command, []);
      expect(result.token).toBe("env-auth-token");
      expect(mockGetKhulnasoftCliToken).not.toHaveBeenCalled();
    });

    test("uses KHULNASOFT_OIDC_TOKEN and calls getKhulnasoftOidcToken when set", async () => {
      process.env.KHULNASOFT_OIDC_TOKEN = "existing-oidc-token";
      mockGetKhulnasoftOidcToken.mockResolvedValue("refreshed-oidc-token");

      const { token } = await import("../../src/args/auth.ts");

      const command = cmd.command({
        name: "test",
        args: { token },
        handler: (args) => args,
      });

      const result = await cmd.run(command, []);
      expect(result.token).toBe("refreshed-oidc-token");
      expect(mockGetKhulnasoftOidcToken).toHaveBeenCalled();
      expect(mockGetKhulnasoftCliToken).not.toHaveBeenCalled();
    });

    test("falls back to getKhulnasoftToken when no env vars set", async () => {
      mockGetKhulnasoftCliToken.mockResolvedValue("cli-token");

      const { token } = await import("../../src/args/auth.ts");

      const command = cmd.command({
        name: "test",
        args: { token },
        handler: (args) => args,
      });

      const result = await cmd.run(command, []);
      expect(result.token).toBe("cli-token");
      expect(mockGetKhulnasoftCliToken).toHaveBeenCalled();
    });

    test("marks a replaced stored token as fresh", async () => {
      mockGetAuth.mockReturnValue({ token: "expired-token" });
      mockGetKhulnasoftCliToken.mockResolvedValue("refreshed-token");

      const { isTokenFresh, token } = await import("../../src/args/auth.ts");
      const command = cmd.command({
        name: "test",
        args: { token },
        handler: (args) => args,
      });

      const result = await cmd.run(command, []);
      expect(mockGetAuth).toHaveBeenCalled();
      expect(isTokenFresh()).toBe(true);
      expect(result.token).toBe("refreshed-token");
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    test("triggers login when getKhulnasoftToken throws AccessTokenMissingError", async () => {
      mockGetKhulnasoftCliToken
        .mockRejectedValueOnce(new AccessTokenMissingError())
        .mockResolvedValueOnce("token-after-login");
      mockLogin.mockResolvedValue(undefined);

      const { token } = await import("../../src/args/auth.ts");

      const command = cmd.command({
        name: "test",
        args: { token },
        handler: (args) => args,
      });

      const result = await cmd.run(command, []);

      expect(mockLogin).toHaveBeenCalled();
      expect(mockGetKhulnasoftCliToken).toHaveBeenCalledTimes(2);
      expect(result.token).toBe("token-after-login");
    });

    test("triggers login when getKhulnasoftToken throws RefreshAccessTokenFailedError", async () => {
      mockGetKhulnasoftCliToken
        .mockRejectedValueOnce(new RefreshAccessTokenFailedError())
        .mockResolvedValueOnce("token-after-login");
      mockLogin.mockResolvedValue(undefined);

      const { token } = await import("../../src/args/auth.ts");

      const command = cmd.command({
        name: "test",
        args: { token },
        handler: (args) => args,
      });

      const result = await cmd.run(command, []);

      expect(mockLogin).toHaveBeenCalled();
      expect(mockGetKhulnasoftCliToken).toHaveBeenCalledTimes(2);
      expect(result.token).toBe("token-after-login");
    });
  });
});
