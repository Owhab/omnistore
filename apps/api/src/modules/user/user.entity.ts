import bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { AbstractEntity } from 'src/common/abstract.entity';
import { RolesEnum } from 'src/constants/role.enum';
import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';

@Entity({ name: 'users' })
export class User extends AbstractEntity {
  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  email: string;

  @Exclude({ toPlainOnly: false })
  @Column({ type: 'varchar', length: 64, nullable: false, select: false })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  role: RolesEnum;

  @Column({ type: 'boolean', default: false, nullable: false })
  isVerified: boolean;

  @Exclude()
  private tempPassword?: string;

  @AfterLoad()
  private loadTempPassword(): void {
    this.tempPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  private async beforeActionsPassword() {
    if (this.tempPassword !== this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    delete this.tempPassword;
  }

  async comparePassword(password: string) {
    return await bcrypt.compare(password, this.password);
  }
}
