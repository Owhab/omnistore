import NotFoundException from 'src/exceptions/not-found.exception';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  ObjectLiteral,
  Repository,
  SaveOptions,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export type SelectFields<T, Options> = Options extends { select: infer Select }
  ? {
      [Key in keyof Select & keyof T]: Select[Key] extends true
        ? T[Key]
        : Select[Key] extends Record<string, any>
          ? T[Key] extends Array<infer U>
            ? Array<SelectFields<U, { select: Select[Key] }>>
            : SelectFields<T[Key], { select: Select[Key] }>
          : never;
    } & Pick<T, MethodsOnly<T>>
  : T;

// Helper type to extract only the methods from the class type
export type MethodsOnly<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repo: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async findMany<Options extends FindManyOptions<T>>(
    findManyArgs: Options,
  ): Promise<Array<SelectFields<T, Options>>> {
    return this.repo.find(findManyArgs) as Promise<
      Array<SelectFields<T, Options>>
    >;
  }

  async findOne<Options extends FindOneOptions<T>>(
    findOneArgs: Options,
  ): Promise<SelectFields<T, Options> | null> {
    return this.repo.findOne(findOneArgs) as Promise<SelectFields<
      T,
      Options
    > | null>;
  }

  async findOneOrThrow<Options extends FindOneOptions<T>>(
    findOneArgs: Options,
    notFoundMessage = 'Resource not found',
  ): Promise<SelectFields<T, Options>> {
    const result = await this.findOne(findOneArgs);
    if (!result) throw new NotFoundException(notFoundMessage);
    return result;
  }

  async update<
    Options extends
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<T>,
  >(criteria: Options, data: QueryDeepPartialEntity<T>): Promise<UpdateResult> {
    return this.repo.update(criteria, data);
  }

  async save(entity: T, options?: SaveOptions): Promise<T> {
    return this.repo.save(entity, options);
  }

  async findOneAndUpdate<Options extends FindOneOptions<T>>(
    findOneArgs: Options,
    data: QueryDeepPartialEntity<T>,
    notFoundMessage?: string,
  ) {
    await this.findOneOrThrow(findOneArgs, notFoundMessage);
    const where = findOneArgs.where as FindOptionsWhere<T>;
    const updateResult = await this.update(where, data);
    const updatedData = await this.findOne(findOneArgs);
    return { data: updatedData, updateResult };
  }

  async delete<
    Options extends FindOptionsWhere<T> | string | number | ObjectId,
  >(criteria: Options): Promise<DeleteResult> {
    return this.repo.delete(criteria);
  }

  async query(query: string, parameters?: any[]): Promise<any> {
    return this.repo.query(query, parameters);
  }

  async count<Options extends FindOneOptions<T>>(
    findOneArgs: Options = {} as Options,
  ): Promise<number> {
    const item = await this.findOne({
      ...findOneArgs,
      select: { id: true },
      order: { id: 'ASC' },
      take: 1,
    });

    // @ts-expect-error can not found id in item
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return item ? item.id : 0;
  }
}
