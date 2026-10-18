import { test, expect, beforeEach, vi } from "vitest";
import {
  getCredentials,
  LocalOidcContextError,
  KhulnasoftOidcContextError,
} from "./get-credentials.js";

// Force `getKhulnasoftOidcToken` to reject so the error-path in `getCredentials`
// runs deterministically. Without this, `@khulnasoft/oidc` discovers the developer's
// linked project via `.khulnasoft/project.json` and refreshes a real token from
// stored `vc` auth — masking the missing-context error these tests assert on.
vi.mock("@khulnasoft/oidc", () => ({
  getKhulnasoftOidcToken: vi.fn(async () => {
    throw new Error("no OIDC context");
  }),
}));

beforeEach(() => {
  delete process.env.KHULNASOFT_OIDC_TOKEN;
});

test("explains how to set up oidc in local", async () => {
  delete process.env.KHULNASOFT_URL;
  await expect(getCredentials()).rejects.toThrowError(LocalOidcContextError);
});

test("explains how to set up oidc in khulnasoft", async () => {
  process.env.KHULNASOFT_URL = "example.khulnasoft.sh";
  await expect(getCredentials()).rejects.toThrowError(KhulnasoftOidcContextError);
});
