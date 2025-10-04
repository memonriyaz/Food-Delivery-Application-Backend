import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { CreateMenuItemInput } from './create-menu-item.input';

@InputType()
export class UpdateMenuItemInput extends PartialType(CreateMenuItemInput) {
  @Field(() => ID)
  id: string;
}
