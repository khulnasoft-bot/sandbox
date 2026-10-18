import { signInAndGetToken, generateCredentials } from "./dev-credentials.js";
import { describe, expect, test, vi, beforeEach, type Mock } from "vitest";
import { factory } from "factoree";
import { setTimeout } from "node:timers/promises";
import { DeviceAuthorizationRequest, OAuth } from "../auth.js";

vi.mock("picocolors");

vi.mock("../auth/index", () => ({
  getAuth: vi.fn(),
  inferScope: vi.fn(),
  updateAuthConfig: vi.fn(),
  OAuth: vi.fn(),
  pollForToken: vi.fn(),
}));

import * as auth from "../auth/index.js";

describe("signInAndGetToken", () => {
  test("times out after provided timeout", async () => {
    const consoleError = vi.spyOn(console, "error").mockReturnValue();
    const promise = signInAndGetToken(
      {
        getAuth: () => null,
        OAuth: async () => {
          return createOAuthFactory({
            async deviceAuthorizationRequest() {
              return createDeviceAuthorizationRequest({
                device_code: "device_code",
                user_code: "user_code",
                verification_uri_complete: `https://example.khulnasoft.sh/device_code?code=user_code`,
                verification_uri: "https://example.khulnasoft.sh/device_code",
              });
            },
          });
        },
        pollForToken: async function* () {
          await setTimeout(500);
        },
      },
      `100 milliseconds`,
    );

    await expect(promise).rejects.toThrowError(
      /Authentication flow timed out after 100 milliseconds./,
    );

    const printed = consoleError.mock.calls.map((x) => x.join(" ")).join("\n");
    expect(printed).toMatchInlineSnapshot(`
      "<yellow><dim>[khulnasoft/sandbox]</dim> No KHULNASOFT_OIDC_TOKEN environment variable found, initiating device authorization flow...
      <dim>[khulnasoft/sandbox]</dim> │  <bold>help:</bold> this flow only happens on development environment.
      <dim>[khulnasoft/sandbox]</dim> │  In production, make sure to set up a proper token, or set up Khulnasoft OIDC [https://khulnasoft.com/docs/oidc].</yellow>
      <blue><dim>[khulnasoft/sandbox]</dim> ╰▶ To authenticate, visit: https://example.khulnasoft.sh/device_code?code=user_code
      <dim>[khulnasoft/sandbox]</dim>    or visit <italic>https://example.khulnasoft.sh/device_code</italic> and type <bold>user_code</bold>
      <dim>[khulnasoft/sandbox]</dim>    Press <bold><return></bold> to open in your browser</blue>
      <red><dim>[khulnasoft/sandbox]</dim> <bold>error:</bold> Authentication failed: Authentication flow timed out after 100 milliseconds.
      <dim>[khulnasoft/sandbox]</dim> │  Make sure to provide a token to avoid prompting an interactive flow.
      <dim>[khulnasoft/sandbox]</dim> ╰▶ <bold>help:</bold> Link your project with <italic><dim>\`</dim>npx khulnasoft link<dim>\`</dim></italic> to refresh OIDC token automatically.</red>"
    `);
  });
});

const createOAuthFactory = factory<Awaited<OAuth>>();
const createDeviceAuthorizationRequest = factory<DeviceAuthorizationRequest>();

describe("generateCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("triggers sign-in when auth exists but has no token", async () => {
    // Auth object with refreshToken but no token - this was the bug
    (auth.getAuth as Mock).mockReturnValue({
      refreshToken: "refresh_xxx",
      expiresAt: new Date(Date.now() + 100000),
    });

    (auth.OAuth as Mock).mockResolvedValue(
      createOAuthFactory({
        async deviceAuthorizationRequest() {
          return createDeviceAuthorizationRequest({
            device_code: "device_code",
            user_code: "user_code",
            verification_uri_complete: "https://khulnasoft.com/device",
            verification_uri: "https://khulnasoft.com/device",
          });
        },
      }),
    );

    (auth.pollForToken as Mock).mockImplementation(async function* () {
      // Simulate successful auth by updating getAuth to return a token
      (auth.getAuth as Mock).mockReturnValue({ token: "new_token" });
      yield { _tag: "Response" as const };
    });

    (auth.inferScope as Mock).mockResolvedValue({
      teamId: "team_xxx",
      projectId: "prj_xxx",
      created: false,
    });

    const result = await generateCredentials({});

    expect(auth.pollForToken).toHaveBeenCalled();
    expect(result).toEqual({
      token: "new_token",
      teamId: "team_xxx",
      projectId: "prj_xxx",
    });
  });

  test("triggers sign-in when auth is null", async () => {
    (auth.getAuth as Mock).mockReturnValue(null);

    (auth.OAuth as Mock).mockResolvedValue(
      createOAuthFactory({
        async deviceAuthorizationRequest() {
          return createDeviceAuthorizationRequest({
            device_code: "device_code",
            user_code: "user_code",
            verification_uri_complete: "https://khulnasoft.com/device",
            verification_uri: "https://khulnasoft.com/device",
          });
        },
      }),
    );

    (auth.pollForToken as Mock).mockImplementation(async function* () {
      (auth.getAuth as Mock).mockReturnValue({ token: "new_token" });
      yield { _tag: "Response" as const };
    });

    (auth.inferScope as Mock).mockResolvedValue({
      teamId: "team_xxx",
      projectId: "prj_xxx",
      created: false,
    });

    await generateCredentials({});

    expect(auth.pollForToken).toHaveBeenCalled();
  });

  test("skips sign-in when auth has valid token", async () => {
    (auth.getAuth as Mock).mockReturnValue({ token: "valid_token" });

    (auth.inferScope as Mock).mockResolvedValue({
      teamId: "team_xxx",
      projectId: "prj_xxx",
      created: false,
    });

    const result = await generateCredentials({});

    expect(auth.pollForToken).not.toHaveBeenCalled();
    expect(auth.OAuth).not.toHaveBeenCalled();
    expect(result).toEqual({
      token: "valid_token",
      teamId: "team_xxx",
      projectId: "prj_xxx",
    });
  });

  test("calls inferScope only once when deriving both teamId and projectId", async () => {
    (auth.getAuth as Mock).mockReturnValue({ token: "valid_token" });

    (auth.inferScope as Mock).mockResolvedValue({
      teamId: "team_xxx",
      projectId: "prj_xxx",
      created: false,
    });

    await generateCredentials({});

    expect(auth.inferScope).toHaveBeenCalledTimes(1);
  });

  test("does not call inferScope when both teamId and projectId are provided", async () => {
    (auth.getAuth as Mock).mockReturnValue({ token: "valid_token" });

    const result = await generateCredentials({
      teamId: "provided_team",
      projectId: "provided_project",
    });

    expect(auth.inferScope).not.toHaveBeenCalled();
    expect(result).toEqual({
      token: "valid_token",
      teamId: "provided_team",
      projectId: "provided_project",
    });
  });

  test("calls inferScope with provided teamId when only teamId is given", async () => {
    (auth.getAuth as Mock).mockReturnValue({ token: "valid_token" });

    (auth.inferScope as Mock).mockResolvedValue({
      teamId: "provided_team",
      projectId: "inferred_project",
      created: false,
    });

    const result = await generateCredentials({ teamId: "provided_team" });

    expect(auth.inferScope).toHaveBeenCalledTimes(1);
    expect(auth.inferScope).toHaveBeenCalledWith({
      teamId: "provided_team",
      token: "valid_token",
    });
    expect(result).toEqual({
      token: "valid_token",
      teamId: "provided_team",
      projectId: "inferred_project",
    });
  });
});
