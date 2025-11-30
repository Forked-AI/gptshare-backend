import {
  Controller,
  Get,
  Param,
  Render,
  NotFoundException,
} from "@nestjs/common";
import { ShareService } from "./share.service";
import { marked } from "marked";

@Controller("view")
export class ViewShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get(":id")
  @Render("share")
  async viewShare(@Param("id") id: string) {
    const share = await this.shareService.getShare(id);

    if (!share) {
      throw new NotFoundException("Share not found");
    }

    // Format the date
    const createdAt = new Date(share.createdAt);
    const formattedDate = createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Parse markdown to HTML
    const summaryHtml = await marked.parse(share.summary || "", {
      breaks: true,
      gfm: true,
    });

    // Estimate reading time in minutes (assuming 175 WPM reading speed)
    const wordCount = (share.summary || "").split(/\s+/).length;
    const readTimeMinutes = Math.round(wordCount / 175);
    const readTimeMinutesStr = `${readTimeMinutes} ${
      readTimeMinutes < 2 ? "minute" : "minutes"
    } read`;

    return {
      title: share.title,
      summary: share.summary,
      summaryHtml,
      keyPoints: share.keyPoints,
      previewText: share.previewText,
      characterCount: share.characterCount || 0,
      formattedDate,
      readTimeMinutesStr,
    };
  }
}
