import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeatureModule } from './features';
import { CoreModule } from './core';

@Module({
  imports: [CoreModule, FeatureModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
