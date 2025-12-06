import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateShareDto } from "./dto/create-share.dto";

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  async createShare(payload: CreateShareDto) {
    const previewText =
      "[AI Conversation Summary — Shared with GPTShare · Fork AI 🍴]\n\n" +
      this.trimByWords(payload.summary || "");
    return this.prisma.share.create({
      data: {
        title: payload.title || "Shared by GPTShare",
        summary: payload.summary || "",
        keyPoints: payload.keyPoints || [],
        previewText,
        selectedMessages: payload.selectedMessages || [],
        options: payload.options,
        characterCount: payload.characterCount || 0,
      },
    });
  }

  async listShares() {
    return this.prisma.share.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getShare(id: string) {
    const share = await this.prisma.share.findUnique({
      where: { id },
    });
    if (!share) {
      throw new Error("Share not found");
    }

    return share;
  }

  trimByWords(text: string, maxLength: number = 100): string {
    // Take a candidate slice up to the max length
    const candidate = text.slice(0, maxLength);
    // Find the last whitespace within the candidate by scanning backward once.
    // This avoids multiple lastIndexOf calls and extra allocations.
    let lastSpace = -1;
    for (let i = candidate.length - 1; i >= 0; i--) {
      if (/\s/u.test(candidate[i])) {
        lastSpace = i;
        break;
      }
    }

    // If we found a whitespace, cut there to keep the last word whole; otherwise use the hard cutoff
    let trimmed = lastSpace > 0 ? candidate.slice(0, lastSpace) : candidate;

    // Remove any trailing whitespace and append ellipsis
    trimmed = trimmed.replace(/\s+$/u, "");

    return trimmed + "...";
  }

  async updateShareSummary(id: string, summary: string) {
    const share = await this.prisma.share.findUnique({
      where: { id },
    });
    if (!share) {
      throw new Error("Share not found");
    }

    return this.prisma.share.update({
      where: { id },
      data: { summary },
    });
  }
}
