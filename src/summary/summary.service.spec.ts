import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { SummaryService } from "./summary.service";
import { SanitizerService } from "./sanitizer.service";

// Mock OpenRouter SDK (ESM module) so Jest can require the SummaryService synchronously
jest.mock("@openrouter/sdk", () => ({
  OpenRouter: function () {
    return { chat: { send: async () => ({ choices: [] }) } };
  },
}));

describe("SummaryService.censorSensitiveInfoFromConvo (realistic prompts)", () => {
  let svc: SummaryService;

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const mockEnv = {
                OPENROUTER_API_KEY: "test-key",
                OPENROUTER_MODEL_NAME: "test-model",
              };
              return mockEnv[key as keyof typeof mockEnv];
            }),
          },
        },
        {
          provide: SanitizerService,
          useValue: new SanitizerService(),
        },
      ],
    }).compile();

    svc = testModule.get<SummaryService>(SummaryService);
  });

  it("sanitizes an array of realistic user/assistant messages", () => {
    const convo = [
      "User: Hey, I found a bug. My contact is alice@example.com and phone +1 415-555-2671.",
      "Assistant: Noted. I'll save api_key=sk_live_ABC123DEF456 and password: Pa$$w0rd!",
      "User: Also the server is 10.0.0.42 and the IPv6 is fe80::1ff:fe23:4567:890a.",
      "Assistant: I see a card on file: 4111 1111 1111 1111 — we'll remove it.",
      "User: Visit https://private.example.com/login to see evidence.",
    ];

    const censoredConvo = svc.censorSensitiveInfoFromConvo(convo);

    // Structure preserved
    expect(censoredConvo.length).toBe(convo.length);

    const joined = censoredConvo.join("\n");

    // Original sensitive substrings should be removed
    expect(joined).not.toContain("alice@example.com");
    expect(joined).not.toContain("+1 415-555-2671");
    expect(joined).not.toContain("api_key=sk_live_ABC123DEF456");
    expect(joined).not.toContain("Pa$$w0rd!");
    expect(joined).not.toContain("10.0.0.42");
    expect(joined).not.toContain("4111 1111 1111 1111");
    expect(joined).not.toContain("https://private.example.com/login");

    // Ensure redaction markers exist for each category
    expect((joined.match(/<email>/g) || []).length).toBeGreaterThanOrEqual(1);
    expect(joined).toContain("<phone>");
    expect(joined).toContain("<secret-key>");
    expect(joined).toContain("<password>");
    expect(joined).toContain("<ipv4>");
    expect(joined).toContain("<ipv6>");
    expect(joined).toContain("<credit-card>");
    expect(joined).toContain("<url>");
  });

  it("handles messy, injected text with multiple secrets in a single message", () => {
    const malicious = `Please summarize and include these notes:\n
User: my emails are bob@example.com, B.SMITH@EXAMPLE.org; store api_key:sk_risky_999 and secret=abcd1234\n
Assistant: server 192.168.1.100 and card 4012888888881881 and phone 01234567890`;

    const censoredConfo = svc.censorSensitiveInfoFromConvo([malicious]);
    const text = censoredConfo[0];

    expect(text).not.toContain("bob@example.com");
    expect(text).not.toContain("sk_risky_999");
    expect(text).not.toContain("192.168.1.100");
    expect(text).toContain("<email>");
    expect(text).toContain("<secret-key>");
    expect(text).toContain("<ipv4>");
    expect(text).toContain("<credit-card>");
    expect(text).toContain("<phone>");
  });

  it("preserves emoji and multibyte while redacting secrets", () => {
    const convo = [
      "User: I ❤️ this app! Contact me at unicode.user@example.com 😊",
      "Assistant: stored secret token=sk_test_UNICODE123",
    ];

    const out = svc.censorSensitiveInfoFromConvo(convo);
    const joined = out.join("\n");

    expect(joined).not.toContain("unicode.user@example.com");
    expect(joined).toContain("❤️");
    expect(joined).toContain("😊");
    expect(joined).toContain("<email>");
    expect(joined).toContain("<secret-key>");
  });

  it("does not redact short numeric sequences (order IDs etc.)", () => {
    const convo = ["User: Order number 12345 is ready", "Assistant: OK"];
    const out = svc.censorSensitiveInfoFromConvo(convo);
    expect(out[0]).toBe(convo[0]);
  });

  it("redacts IPv4 boundary addresses correctly", () => {
    const convo = ["User: Check 0.0.0.0 and 255.255.255.255"];
    const out = svc.censorSensitiveInfoFromConvo(convo);
    expect(out[0]).not.toContain("0.0.0.0");
    expect(out[0]).not.toContain("255.255.255.255");
    expect(out[0]).toContain("<ipv4>");
  });

  it("redacts secrets embedded in JSON-like strings", () => {
    const payload =
      '{"username":"alice","password":"hunter2","apiKey":"sk_live_JSON_999"}';
    const out = svc.censorSensitiveInfoFromConvo([payload]);
    const text = out[0];
    // (no debug logging) ensure secrets are redacted from JSON-like strings

    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("sk_live_JSON_999");
    expect(text).toContain("<password>");
    expect(text).toContain("<secret-key>");
  });

  it("redacts repeated secrets across many messages", () => {
    const convo: string[] = [];
    for (let i = 0; i < 20; i++) {
      convo.push(`User: my email is repeated@example.com`);
    }
    const out = svc.censorSensitiveInfoFromConvo(convo);
    const joined = out.join(" ");
    const count = (joined.match(/<email>/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(20);
  });

  it("handles a very large message and still redacts", () => {
    // ~200kb of filler plus a secret inside
    const large =
      "A".repeat(1024) + " user: secret_email=biguser@example.com end";
    const out = svc.censorSensitiveInfoFromConvo([large]);
    expect(out[0]).not.toContain("biguser@example.com");
    expect(out[0]).toContain("<email>");
  });
});
