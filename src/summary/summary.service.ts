import { OpenRouter } from "@openrouter/sdk";
import { Injectable, Logger } from "@nestjs/common";
import type { ChatGenerationParams, Message } from "@openrouter/sdk/esm/models";
import type { SummaryOptions } from "./dto/summary-request.dto";
import { SanitizerService } from "./sanitizer.service";
import { ConfigService } from "@nestjs/config";
import { TokensService } from "./tokens.service";

@Injectable()
export class SummaryService {
  private readonly openRouter: OpenRouter | null = null;
  private readonly modelName: string;

  constructor(
    private readonly sanitizerService: SanitizerService,
    private readonly configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>("OPENROUTER_API_KEY");
    this.openRouter = new OpenRouter({ apiKey });
    this.modelName = this.configService.get<string>("OPENROUTER_MODEL_NAME")!;
  }

  async buildGenerationPayload(
    convo: string[],
    options: SummaryOptions = {}
  ): Promise<{
    genPayload: ChatGenerationParams;
    sanitizedTexts: string[]; // few sanitized texts for frontend preview
    convoLength: number;
  }> {
    if (!convo || convo.length === 0) {
      throw new Error("Conversation array is empty.");
    }

    if (convo.length % 2 !== 0) {
      throw new Error(
        "Conversation array must have an even number of messages."
      );
    }
    // Base system instruction
    let fullContent = this.configService.get<string>("PROMPT_SUMMARY")!;

    if (options.hideSensitive === true) {
      console.log("Censoring sensitive info from convo before summarization.");
      convo = this.censorSensitiveInfoFromConvo(convo);
      fullContent +=
        "\n" + this.configService.get<string>("PROMPT_HIDE_SENSITIVE")!;
    }

    if (options.tone) {
      fullContent += `\nTone: ${options.tone}`;
    }

    // Build single unified text block from convo array
    const convoText = convo
      .map((msg, index) => {
        const role = index % 2 === 0 ? "User" : "Assistant";
        // return `${speaker}: ${msg}`;
        return `[${role}]: ${msg}`;
      })
      .join("\n");
    fullContent += "\n\n--Convo Start--\n" + convoText + "\n--Convo End--";

    // Add summarization level instructions
    if (options.summaryDetail) {
      const summaryDetailPrompts = {
        brief: this.configService.get<string>("PROMPT_SUMMARY_BRIEF")!,
        balanced: this.configService.get<string>("PROMPT_SUMMARY_BALANCED")!,
        detailed: this.configService.get<string>("PROMPT_SUMMARY_DETAILED")!,
      };
      fullContent += "\n" + summaryDetailPrompts[options.summaryDetail];
    }

    // Add custom instruction if provided
    if (options.customInstruction && options.customInstruction.trim()) {
      fullContent +=
        "\n\nUser's additional instruction: " +
        options.customInstruction.trim();
    }

    // Reinforce the instruction at the end of the user prompt to combat context window loss
    if (options.hideSensitive === true) {
      fullContent +=
        "\n\nIMPORTANT: As explicitly instructed in the system prompt, you MUST redact any sensitive credentials, passwords, API keys, or PII found in the conversation above. Replace them with ***.";
    }

    const messages: Message[] = [{ role: "system", content: fullContent }];
    console.log(
      "[DEBUG] All messages that will be sent to OpenRouter: ",
      messages
    );
    console.log("[DEBUG] Prompt length: ", fullContent.length);

    return {
      genPayload: {
        model: this.modelName,
        messages,
        stream: false,
      },
      sanitizedTexts: convo
        .slice(0, 3)
        .map((msg) => this.truncateString(msg, 50)),
      convoLength: convo.length,
    };
  }

  async summarize(generationPaylaod: ChatGenerationParams): Promise<{
    summaryChoices: string[];
    convoLength: number;
  }> {
    if (!this.openRouter) {
      throw new Error("OpenRouter client not initialized.");
    }

    try {
      const result = await this.openRouter.chat.send({
        ...generationPaylaod,
        stream: false,
      });
      // const result = {
      //   choices: [
      //     {
      //       message: {
      //         content: "This is a placeholder summary from OpenRouter.",
      //       },
      //     },
      //   ],
      // };
      console.log("OpenRouter summarization result (if any):", result);

      // Extract text from the structured response
      if (result) {
        const summaryChoices = result.choices.map((c) =>
          String(c.message.content)
        );
        console.log(
          "Extracted summary messages (each one is a potential one to choose from): ",
          summaryChoices
        );

        const convoLength = generationPaylaod.messages.length;
        return {
          summaryChoices,
          convoLength,
        };
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Full error: ", err);
      console.error(
        "OpenRouter API error — falling back to local summarizer:",
        err instanceof Error ? err.message : String(err)
      );
    }

    return {
      summaryChoices: [],
      convoLength: 0,
    };
  }

  censorSensitiveInfoFromConvo(convo: string[]): string[] {
    return convo.map((message) =>
      this.sanitizerService.censorSensitiveInfo(message)
    );
  }

  private truncateString(str: string, max = 50): string {
    if (!str) return "";
    if (str.length <= max) return str;
    const ellipsis = "...";
    return str.trim().slice(0, Math.max(0, max - ellipsis.length)) + ellipsis;
  }

  getModelName(): string {
    return this.modelName;
  }

  // /**
  //  *
  //  * @notice Removes confidential information from the conversation using the SanitizerService.
  //  * using chunk processing to handle large conversations.
  //  * @param convo conversation array (alternating user and assistant messages)
  //  * @returns censored conversation array with confidential information removed
  //  */
  // async removeConfidentialInfo(convo: string[]): Promise<string[]> {
  //   const idealChunkSize = 1024 * 50; // aim for 50kB chunk size
  //   // const chunks = [];
  //   let currChunk = "";
  //   const formatText = (text: string): string => {
  //     return `${text.length}\n${text}\n`;
  //   };

  //   let censoredConvo: string[] = [];

  //   const breakDownChunk = (chunk: string): string[] => {
  //     const pieces: string[] = [];
  //     const len = chunk.length;
  //     let numStartIdx = 0;
  //     for (let i = 0; i < len; i++) {
  //       if (/[1-9]/.test(chunk[i])) {
  //         // If it is digit
  //         continue;
  //       } else {
  //         const pieceLen = Number(chunk.slice(numStartIdx, i));
  //         const textStartIdx = i + 1;
  //         const textEndIdx = i + pieceLen;
  //         const piece = chunk.slice(textStartIdx, textEndIdx + 1);
  //         pieces.push(piece);
  //         const nextNumIdx = textEndIdx + 2;
  //         numStartIdx = nextNumIdx;
  //         i = numStartIdx;
  //       }
  //     }
  //     return pieces;
  //   };

  //   // merge texts into 50kb chunks
  //   //  During the merge, append length separation to each piece of text to later reconstruct them
  //   for (const text of convo) {
  //     if (currChunk.length + text.length <= idealChunkSize) {
  //       currChunk += formatText(text);
  //     } else {
  //       // for each chunk, regex to detect and replace obvious confidential info with asterisks (***)
  //       // Censor values
  //       const censoredChunk =
  //         this.sanitizerService.censorConfidentialInfo(currChunk);
  //       // reconstruct the original convo after removing confidential info
  //       censoredConvo = [...censoredConvo, ...breakDownChunk(censoredChunk)];

  //       // Add new text to new chunk
  //       currChunk += formatText(text);
  //       // Cut-off
  //       currChunk = "";
  //     }
  //   }
  //   return censoredConvo;
  // }
}
