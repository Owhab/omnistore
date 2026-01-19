import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import {
  DataSource,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from "typeorm";

type FindConditionFn<T extends ObjectLiteral> = (
  repo: Repository<T>,
  value: any,
  args: ValidationArguments,
) => Promise<any>;

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueConstraint<T extends ObjectLiteral>
  implements ValidatorConstraintInterface
{
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [EntityClass, findConditionFnOrField] =
      args.constraints as unknown as [
        new () => T,
        FindConditionFn<T> | keyof T,
      ];

    const repo = this.dataSource.getRepository(EntityClass);

    let existingRecord: unknown;

    if (typeof findConditionFnOrField === "function") {
      existingRecord = await findConditionFnOrField(repo, value, args);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      existingRecord = await repo.findOneBy({
        [findConditionFnOrField]: value,
      } as FindOptionsWhere<T>);
    }

    return !existingRecord;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be unique.`;
  }
}

export function IsUnique<T extends ObjectLiteral>(
  entity: new () => T,
  findConditionFnOrField: FindConditionFn<T> | keyof T,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (target: object, propertyName: string | symbol) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      constraints: [entity, findConditionFnOrField],
      validator: IsUniqueConstraint,
    });
  };
}
