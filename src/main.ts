import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { join } from "path";
import * as bodyParser from "body-parser";
import * as process from "process";
import * as dotenv from "dotenv";
import * as hbs from "hbs";
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["log", "error", "warn", "debug"],
  });

  // Increase request payload limit
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      // forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
    })
  );

  // Register Handlebars helper to use in templates
  hbs.registerHelper("encodeURIComponent", (str: string) => {
    return encodeURIComponent(str);
  });

  // Configure Handlebars view engine
  app.setBaseViewsDir(join(__dirname, "..", "views"));
  app.setViewEngine("hbs");

  // Serve static assets (CSS, images, etc.)
  app.useStaticAssets(join(__dirname, "..", "public"));

  const port = process.env.PORT ? Number(process.env.PORT) : 3333;
  app.enableCors();
  await app.listen(port);
  console.log(`GPTShare server listening on http://localhost:${port}`);
}
bootstrap();
