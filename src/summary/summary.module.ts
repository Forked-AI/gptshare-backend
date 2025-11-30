import { Module } from "@nestjs/common";
import { SummaryService } from "./summary.service";
import { SummaryController } from "./summary.controller";
import { SanitizerService } from "./sanitizer.service";
import { TokensService } from "./tokens.service";

@Module({
  controllers: [SummaryController],
  providers: [SummaryService, SanitizerService, TokensService],
  exports: [SummaryService],
})
export class SummaryModule {}
