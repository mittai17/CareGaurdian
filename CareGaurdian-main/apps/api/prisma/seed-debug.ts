import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ChangeDetectionService } from '../src/modules/change-detection/change-detection.service';
async function go() {
  process.stdout.write('P4: creating context...\n');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  process.stdout.write('P4: context created\n');
  const change = app.get(ChangeDetectionService);
  process.stdout.write('P4: running detect...\n');
  const res = await change.detect('00000000-0000-4000-8000-0000000000pat');
  process.stdout.write('P4: detect done json=' + JSON.stringify(res.data ?? res.message) + '\n');
  await app.close();
  process.stdout.write('P4: closed\n');
  process.exit(0);
}
go().catch((e) => { process.stdout.write('P4 ERR: ' + (e?.stack ?? e) + '\n'); process.exit(1); });
setTimeout(() => { process.stdout.write('P4: TIMEOUT\n'); process.exit(2); }, 60000).unref();
