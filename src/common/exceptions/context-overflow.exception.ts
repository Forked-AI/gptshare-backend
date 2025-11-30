import { HttpException, HttpStatus } from "@nestjs/common";

export interface ContextOverflowErrorData {
  code: "CONTEXT_OVERFLOW";
  tokenCount: number;
  maxTokens: number;
  message: string;
}

export class ContextOverflowException extends HttpException {
  constructor(tokenCount: number, maxTokens: number) {
    const errorData: ContextOverflowErrorData = {
      code: "CONTEXT_OVERFLOW",
      tokenCount,
      maxTokens,
      message: `Your conversation is too long (${tokenCount.toLocaleString()} tokens). The maximum allowed is ${maxTokens.toLocaleString()} tokens. Please select fewer messages.`,
    };

    super(errorData, HttpStatus.BAD_REQUEST);
  }
}
