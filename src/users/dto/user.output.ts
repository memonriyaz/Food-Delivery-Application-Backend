import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserOutput {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  role: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => [UserAddressOutput], { nullable: true })
  addresses?: UserAddressOutput[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class UserAddressOutput {
  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  zipCode: string;

  @Field()
  isDefault: boolean;
}
