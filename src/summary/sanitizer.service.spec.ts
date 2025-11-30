import { SanitizerService } from "./sanitizer.service";

describe("SanitizerService (robust)", () => {
  let svc: SanitizerService;

  beforeEach(() => {
    svc = new SanitizerService();
  });

  it("replaces basic email addresses", () => {
    const input = "Reach me at alice@example.com for details.";
    const out = svc.censorSensitiveInfo(input);
    expect(out).toBe("Reach me at <email> for details.");
  });

  it("replaces multiple emails and counts occurrences", () => {
    const input = "Send to bob@example.com and alice@example.com.";
    const out = svc.censorSensitiveInfo(input);
    const emails = (out.match(/<email>/g) || []).length;
    expect(emails).toBe(2);
  });

  it("replaces http/https and www urls", () => {
    const a = "Visit https://example.com/page for info.";
    const b = "Visit www.example.com for info.";
    expect(svc.censorSensitiveInfo(a)).toContain("<url>");
    expect(svc.censorSensitiveInfo(b)).toContain("<url>");
  });

  it("replaces IPv4 and IPv6 addresses", () => {
    const ipv4 = "Server is at 192.168.0.1.";
    const ipv6 = "Host: fe80::1ff:fe23:4567:890a.";
    expect(svc.censorSensitiveInfo(ipv4)).toBe("Server is at <ipv4>.");
    expect(svc.censorSensitiveInfo(ipv6)).toContain("<ipv6>");
  });

  it("replaces various phone number formats", () => {
    const phone1 = "Call me at +1 415-555-2671.";
    const phone2 = "My number: 415.555.2671";
    const phone3 = "+84 234 567 890 | 01234567890 |  0123 456 7890";
    const phone4 = "+84 234 567 890|01234567890|0123 456 7890";
    expect(svc.censorSensitiveInfo(phone1)).toBe("Call me at <phone>.");
    expect(svc.censorSensitiveInfo(phone2)).toContain("<phone>");
    // Preserve original spacing; accept either compact or spaced pipe separators
    expect(svc.censorSensitiveInfo(phone3)).toMatch(
      /^<phone>\s*\|\s*<phone>\s*\|\s*<phone>$/
    );
    expect(svc.censorSensitiveInfo(phone4)).toMatch(
      /^<phone>\s*\|\s*<phone>\s*\|\s*<phone>$/
    );
  });

  it("does not mistaken a short, consecutive sequence of number as phone number", () => {
    const numSequence = "12345";
    expect(svc.censorSensitiveInfo(numSequence)).toBe(numSequence);
  });

  it("replaces credit card numbers in different spacing", () => {
    const cc1 = "Card: 4111111111111111";
    const cc2 = "Card spaced: 4111 1111 1111 1111";
    expect(svc.censorSensitiveInfo(cc1)).toContain("<credit-card>");
    expect(svc.censorSensitiveInfo(cc2)).toContain("<credit-card>");
  });

  it("replaces username and password patterns (common forms)", () => {
    const text = "username: 'alice' password=\"s3cr3t\"";
    const out = svc.censorSensitiveInfo(text);
    expect(out).toContain("<username>");
    expect(out).toContain("<password>");
  });

  it("only redacts username assignments (including '=')", () => {
    const usernameText = "username=alice password=Pa$$w0rd!";
    const usernameOut = svc.censorSensitiveInfo(usernameText);
    const loginText = "login=alice pwd=Pa$$w0rd!";
    const loginOut = svc.censorSensitiveInfo(loginText);

    expect(usernameOut).toContain("<username>");
    expect(usernameOut).toContain("<password>");
    expect(loginOut).not.toContain("<username>");
    expect(loginOut).toContain("<password>");
  });

  it("redacts username/password fields embedded within JSON-like strings", () => {
    const payload = '{"username":"alice","password":"hunter2"}';
    const out = svc.censorSensitiveInfo(payload);
    expect(out).toContain("<username>");
    expect(out).toContain("<password>");
    expect(out).not.toContain("hunter2");
  });

  it("redacts explicit user/pass assignments with '=' but leaves natural 'User:' text", () => {
    const creds = "user=svc_ops pass=minhduc868";
    const out = svc.censorSensitiveInfo(creds);
    const natural = "User: Order number 12345 is ready.";
    const naturalOut = svc.censorSensitiveInfo(natural);

    expect(out).toContain("<username>");
    expect(out).toContain("<password>");
    expect(naturalOut).toBe(natural);
  });

  it("replaces secret keys / api keys (different labels)", () => {
    const cases = [
      "api_key: ABCDEFGHIJKLMNOP123456",
      "secret=abcdef1234567890",
      "bearer: XYZ-123-SECRET",
    ];
    cases.forEach((c) => {
      expect(svc.censorSensitiveInfo(c)).toContain("<secret-key>");
    });
  });

  it("replaces secret keys embedded in JSON objects", () => {
    const payload = '{"apiKey":"sk_live_JSON_999"}';
    const out = svc.censorSensitiveInfo(payload);
    expect(out).toContain("<secret-key>");
    expect(out).not.toContain("sk_live_JSON_999");
  });

  it("handles a simulated AI prompt that injects many confidential items", () => {
    const prompt = `Summarize the conversation and include these details:\n
User: My email is reporter@example.org and my backup is J.SMITH@Example.COM.\n
Assistant: Store api_key=sk_live_ABC123DEF456 and password: Pa$$w0rd!\n
User: Server at 10.0.0.42 and IPv6 fe80::1ff:fe23:4567:890a.\n
Also my card 4111 1111 1111 1111 and phone +44 7700 900123. Visit https://private.example.com/login`;

    const out = svc.censorSensitiveInfo(prompt);

    // Ensure each confidential marker appears at least once
    expect((out.match(/<email>/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(out).toContain("<secret-key>");
    expect(out).toContain("<password>");
    expect(out).toContain("<ipv4>");
    expect(out).toContain("<ipv6>");
    expect(out).toContain("<credit-card>");
    expect(out).toContain("<phone>");
    expect(out).toContain("<url>");
  });

  it("handles a simualted AI prompt that injects many confidential items (2)", () => {
    const prompt =
      'I\'m preparing a post-incident narrative for leadership at Sunbyte Digital Solutions. Last night our deployment pipeline crashed for 6 hours after the loss of the workflow reference file named "sunbyte-prod-master-A123.yaml" on my local machine. That file unfortunately still contained an old embedded integration block: admin_user=svc_ops_legacy, admin_pass=minhduc868. I need help rewriting this for clarity — can you summarize the sequence of events?';
    const out = svc.censorSensitiveInfo(prompt);
    expect(out).not.toContain("svc_ops_legacy");
    expect(out).not.toContain("minhduc868");
  });

  it("does not modify unrelated text (edge case)", () => {
    const text =
      "This is a safe sentence with no secrets and numbers like 12345.";
    expect(svc.censorSensitiveInfo(text)).toBe(text);
  });
});
