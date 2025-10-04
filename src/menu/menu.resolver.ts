import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuItemOutput } from './dto/menu-item.output';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Resolver(() => MenuItemOutput)
export class MenuResolver {
  constructor(private readonly menuService: MenuService) {}

  /*
    ------------------------
    ADMIN MUTATIONS (protected)
    ------------------------
  */

  /*
   - Create a new menu item 
   - Throw error if creation fails
   - Return the created menu item
   */

  @UseGuards(GqlAuthGuard)
  @Mutation(() => MenuItemOutput)
  async addMenuItem(@Args('input') input: CreateMenuItemInput) {
    try {
      return await this.menuService.createMenuItem(input);
    } catch (error) {
      throw new Error(`Failed to create menu item: ${error.message}`);
    }
  }

  /*
   - Update an existing menu item
   - Throw error if update fails
   - Return the updated menu item
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => MenuItemOutput)
  async updateMenuItem(@Args('input') input: UpdateMenuItemInput) {
    try {
      return await this.menuService.updateMenuItem(input.id, input);
    } catch (error) {
      throw new Error(`Failed to update menu item: ${error.message}`);
    }
  }

  /* 
  - Soft delete a menu item (set isAvailable to false)
  - Throw error if deletion fails
  - Return the deleted menu item
  */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => MenuItemOutput)
  async deleteMenuItem(@Args('id', { type: () => ID }) id: string) {
    try {
      return await this.menuService.removeMenuItem(id);
    } catch (error) {
      throw new Error(`Failed to delete menu item: ${error.message}`);
    }
  }

  /*
    ------------------------
    ADMIN Queries (no auth yet)
    ------------------------
  */

  /*
  - Get all menu items
  - Throw error if retrieval fails
  - Return list of all menu items including unavailable ones
  */
  @Query(() => [MenuItemOutput], { name: 'allMenuItems' })
  async getAllMenuItems() {
    try {
      return await this.menuService.findAllItems();
    } catch (error) {
      throw new Error(`Failed to retrieve all menu items: ${error.message}`);
    }
  }

  /*
    ------------------------
    PUBLIC QUERIES
    ------------------------
  */

  /*
  - Get all available menu items
  - Throw error if retrieval fails
  - Return list of available menu items
  */
  @Query(() => [MenuItemOutput], { name: 'menuItems' })
  async getMenuItems() {
    try {
      return await this.menuService.findAllAvailable();
    } catch (error) {
      throw new Error(`Failed to fetch menu items: ${error.message}`);
    }
  }

  /* 
  - Get menu items by category ['appetizer', 'main', 'dessert', 'beverage']
  - Throw error if retrieval fails
  - Return list of menu items in the category
  */
  @Query(() => [MenuItemOutput], { name: 'menuItemsByCategory' })
  async getMenuItemsByCategory(@Args('category') category: string) {
    try {
      return await this.menuService.findByCategory(category);
    } catch (error) {
      throw new Error(
        `Failed to fetch menu items by category: ${error.message}`,
      );
    }
  }

  /*
  - Get menu item by ID
  - Throw NotFoundException if item not found
  - Throw error if retrieval fails
  - Return the menu item
  */
  @Query(() => MenuItemOutput, { name: 'menuItem' })
  async getMenuItem(@Args('id', { type: () => ID }) id: string) {
    try {
      return await this.menuService.findMenuItemById(id);
    } catch (error) {
      throw new Error(`Failed to fetch menu item by ID: ${error.message}`);
    }
  }

  /*
  - Search menu items by name/description (case insensitive)
  - Throw error if search fails
  - Return list of matching menu items
  */
  @Query(() => [MenuItemOutput], { name: 'searchMenuItems' })
  async searchMenuItems(@Args('query') query: string) {
    try {
      return await this.menuService.searchItems(query);
    } catch (error) {
      throw new Error(`Failed to search menu items: ${error.message}`);
    }
  }
}
