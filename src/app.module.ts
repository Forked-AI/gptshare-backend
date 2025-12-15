import { Module } from "@nestjs/common";
import { SummaryModule } from "./summary/summary.module";
import { HealthModule } from "./health/health.module";
import { ShareModule } from "./share/share.module";
import { PrismaModule } from "./prisma/prisma.module";
import { DocsModule } from "./docs/docs.module";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

@Module({
  imports: [
    PrismaModule,
    SummaryModule,
    HealthModule,
    ShareModule,
    DocsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        OPENROUTER_API_KEY: Joi.string().required(),
        OPENROUTER_MODEL_NAME: Joi.string().required(),
        PROMPT_SUMMARY: Joi.string().required(),
        PROMPT_HIDE_SENSITIVE: Joi.string().required(),
        PROMPT_SUMMARY_BRIEF: Joi.string().required(),
        PROMPT_SUMMARY_BALANCED: Joi.string().required(),
        PROMPT_SUMMARY_DETAILED: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        HF_ACCESS_TOKEN: Joi.string().required(),
        MODEL_CONFIG_URL: Joi.string().required(),
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
