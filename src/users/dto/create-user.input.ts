import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;  // ⚡ must be hashed in service, not here

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  role?: string;  // defaults to 'customer'

  @Field({ nullable: true })
  phone?: string;

  @Field(() => [UserAddressInput], { nullable: true })
  addresses?: UserAddressInput[];
}

@InputType()
export class UserAddressInput {
  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  zipCode: string;

  @Field({ defaultValue: false })
  isDefault: boolean;
}
