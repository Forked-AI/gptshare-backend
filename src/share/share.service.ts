import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateShareDto } from "./dto/create-share.dto";

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  async createShare(payload: CreateShareDto) {
    return this.prisma.share.create({
      data: {
        title: payload.title || "Shared by GPTShare",
        summary: payload.summary || "",
        keyPoints: payload.keyPoints || [],
        previewText: payload.previewText || "",
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
