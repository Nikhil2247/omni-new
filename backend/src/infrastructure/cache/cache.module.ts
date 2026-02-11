import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DragonflyService } from './dragonfly.service'
import { CacheAsideStrategy } from './strategies/cache-aside.strategy'
import { ReadThroughStrategy } from './strategies/read-through.strategy'
import { WriteThroughStrategy } from './strategies/write-through.strategy'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DragonflyService,
    CacheAsideStrategy,
    ReadThroughStrategy,
    WriteThroughStrategy,
  ],
  exports: [
    DragonflyService,
    CacheAsideStrategy,
    ReadThroughStrategy,
    WriteThroughStrategy,
  ],
})
export class CacheModule {}
