import { Injectable } from "@nestjs/common";
import { AutoTokenizer } from "@xenova/transformers";
import { ConfigService } from "@nestjs/config";
import { ContextOverflowException } from "../common/exceptions/context-overflow.exception";

@Injectable()
export class TokensService {
  private readonly tokenizerCache: Map<string, any> = new Map();
  private modelConfig: Record<any, any> = {};

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const modelConfigUrl =
        this.configService.get<string>("MODEL_CONFIG_URL")!;
      const res = await fetch(modelConfigUrl);
      this.modelConfig = await res.json();
      console.log(
        `[TokensService] Loaded model config: ${JSON.stringify(
          this.modelConfig
        )}`
      );
    } catch (e) {
      throw new Error(`Failed to fetch model config: ${e}`);
    }
  }

  /**
   *
   * Throws an error if the text exceeds the token limit for the given model.
   * @param text
   * @param summaryModel
   */
  async ensurePromptUnderTokenLimit(prompt: string, summaryModel: string) {
    const inputTokenCount = await this.countTokens(prompt, summaryModel);

    // Get model's context window size
    const contextWindowSize =
      this.getModelInfoFromConfig(summaryModel).contextWindowSize;
    console.log(
      `DEBUG: inputTokenCount=${inputTokenCount}, contextWindowSize=${contextWindowSize}`
    );
    if (inputTokenCount > contextWindowSize) {
      throw new ContextOverflowException(inputTokenCount, contextWindowSize);
    }
  }

  private getModelInfoFromConfig(summaryModel: string): Record<string, any> {
    const modelInfo = this.modelConfig[summaryModel];
    if (!modelInfo) {
      throw new Error(
        `No model config found for summary model: ${summaryModel}`
      );
    }
    return modelInfo;
  }

  private async getTokenizerOfModel(summaryModel: string) {
    const tokenizerName =
      this.getModelInfoFromConfig(summaryModel).tokenizerName;
    if (!tokenizerName) {
      throw new Error(`Tokenizer name not found for model: ${summaryModel}`);
    }

    if (!this.tokenizerCache.has(tokenizerName)) {
      console.log(`[TokensService] Loading tokenizer: ${tokenizerName}`);
      const tokenizer = await AutoTokenizer.from_pretrained(tokenizerName);
      this.tokenizerCache.set(tokenizerName, tokenizer);
    }

    return this.tokenizerCache.get(tokenizerName);
  }

  protected async countTokens(
    text: string,
    summaryModel: string
  ): Promise<number> {
    const tokenizer = await this.getTokenizerOfModel(summaryModel);
    const encoded = tokenizer.encode(text);
    return encoded.length;
  }
}
