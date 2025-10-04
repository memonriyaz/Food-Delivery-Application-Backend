import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserOutput {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  role: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
