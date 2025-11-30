import { Injectable } from "@nestjs/common";

@Injectable()
export class SanitizerService {
  private readonly confidentialRegexPatterns: Array<[string, RegExp]> = [
    // Put longer / more specific patterns first
    [
      "credit-card",
      /\b(?:\d[ -]*?){13,16}\b/g, // catches Visa, MasterCard, AmEx, Discover, JCB, etc.
    ],
    ["ipv6", /\b([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}\b/gi],
    [
      "ipv4",
      /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g,
    ],
    [
      "secret-key",
      /["']?\b(api[_-]?key|secret|token|bearer|auth[_-]?key)\b["']?\s*[:=]\s*["']?([A-Za-z0-9._\-]{8,})["']?/gi,
    ],
    [
      "username",
      /["']?\busername\b["']?\s*[:=]\s*["']?([^\s"',}]+)["']?/gi,
    ],
    [
      "username",
      /\b[\w.-]*user[\w.-]*\b\s*=\s*["']?([^\s"',}]+)["']?/gi,
    ],
    [
      "password",
      /["']?\b(pass(word)?|pwd)\b["']?\s*[:=]\s*["']?([^\s"',}]+)["']?/gi,
    ],
    [
      "password",
      /\b[\w.-]*(pass(word)?|pwd)[\w.-]*\b\s*=\s*["']?([^\s"',}]+)["']?/gi,
    ],
    ["email", /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g],
    ["url", /\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+/gi],
    [
      "phone",
      // Conservative phone matcher with two branches:
      // 1) formatted numbers with separators and optional leading +
      //    (requires separators between groups to avoid accidental short matches)
      // 2) contiguous digit sequences of length 7-13 (to catch compact national numbers)
      /(?:(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]){1,3}\d{2,4}|\b\d{7,13}\b)/g,
    ],
  ];

  public censorSensitiveInfo(text: string) {
    let out = text;
    for (const [patternKey, pattern] of this.confidentialRegexPatterns) {
      out = out.replace(pattern, `<${patternKey}>`);
    }
    return out;
  }
}
