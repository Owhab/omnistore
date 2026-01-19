import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import chalk from "chalk";
import { useContainer } from "class-validator";
import compression from "compression";
import helmet from "helmet";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { EnvService } from "./shared/services/env.service";
import { SharedModule } from "./shared/shared.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const envService = app.select(SharedModule).get(EnvService);

  app.use(helmet());
  app.use(compression());
  app.enableCors(envService.corsConfig);
  app.enableVersioning({
    type: VersioningType.URI,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  if (envService.isDevelopment) {
    const config = new DocumentBuilder()
      .setTitle("Hire Smart API doc")
      .setDescription("Find the API from here")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api-doc", app, documentFactory);
  }

  const port = envService.appConfig.port;

  await app.listen(port).then(async () => {
    console.log(
      `
        #############################################
        🔥  Server listening on: ${chalk.bold(await app.getUrl())} 🔥
        #############################################
      `,
    );
  });
}

void bootstrap();
