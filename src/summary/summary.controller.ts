import { Body, Controller, Post } from "@nestjs/common";
import { SummaryService } from "./summary.service";
import { SummaryRequestDto } from "./dto/summary-request.dto";
import { TokensService } from "./tokens.service";

@Controller("summary")
export class SummaryController {
  constructor(
    private readonly summaryService: SummaryService,
    private readonly tokensService: TokensService
  ) {}

  @Post()
  async summarize(@Body() body: SummaryRequestDto) {
    const { convo, options } = body;
    const { genPayload, sanitizedTexts, convoLength } =
      await this.summaryService.buildGenerationPayload(convo, options);

    const fullPromptContent = genPayload.messages
      .map((msg) => msg.content)
      .join("\n");

    // Throws ContextOverflowException if prompt exceeds token limit
    await this.tokensService.ensurePromptUnderTokenLimit(
      fullPromptContent,
      this.summaryService.getModelName()
    );

    const { summaryChoices } = await this.summaryService.summarize(genPayload);
    return { summaryChoices, sanitizedTexts, convoLength };
  }
}
