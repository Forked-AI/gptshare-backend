import { Module } from "@nestjs/common";
import { ShareService } from "./share.service";
import { ShareController } from "./share.controller";
import { ViewShareController } from "./view-share.controller";

@Module({
  controllers: [ShareController, ViewShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
