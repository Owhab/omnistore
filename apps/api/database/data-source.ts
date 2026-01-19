import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import type { SeederOptions } from 'typeorm-extension';

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/src/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  seeds: ['dist/database/seeds/**/*{.ts,.js}'],
  seedTableName: 'typeormSeeders',
  seedTracking: true,
  migrationsTableName: 'typeormMigrations',
  logging: true,
  synchronize: true,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
