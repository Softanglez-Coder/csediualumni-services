import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeatureModule } from './features/feature.module';

@Module({
  imports: [FeatureModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
