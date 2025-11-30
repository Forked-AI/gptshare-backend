import { Body, Controller, Get, Param, Post, Patch } from "@nestjs/common";
import { ShareService } from "./share.service";
import { CreateShareDto, UpdateShareDto } from "./dto/create-share.dto";

@Controller("shares")
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  async create(@Body() body: CreateShareDto) {
    const share = await this.shareService.createShare(body);
    return share;
  }

  @Get()
  async list() {
    return this.shareService.listShares();
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.shareService.getShare(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: UpdateShareDto) {
    return this.shareService.updateShareSummary(id, body.summary || "");
  }
}
