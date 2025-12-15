import { Controller, Get, Render } from "@nestjs/common";

@Controller("docs")
export class DocsController {
  @Get("privacy")
  @Render("privacy")
  getPrivacyPolicy() {
    return {
      lastUpdated: "December 16, 2025",
      contactEmail: "nndminh2013@gmail.com",
    };
  }
}
