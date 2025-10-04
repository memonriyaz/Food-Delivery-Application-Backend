import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu } from '../schemas/menu.schema';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';

@Injectable()
export class MenuService {
  constructor(@InjectModel(Menu.name) private menuModel: Model<Menu>) {}

  /*
    ------------------------
    ADMIN METHODS
    ------------------------
  */


  /*
  - Create menu item
  - Throw error if creation fails
  */
  async createMenuItem(createMenuItemDto: CreateMenuItemInput): Promise<Menu> {
    try{
      const newItem = new this.menuModel(createMenuItemDto);
    return newItem.save();
    }catch(error){
      throw new Error(`Failed to create menu item: ${error.message}`);
    }
  }

  /* 
  - Update menu item
  - Throw error if update fails
  - Throw NotFoundException if item not found
  */
  async updateMenuItem(id: string, updateMenuItemDto: UpdateMenuItemInput): Promise<Menu> {
   try{
     const updatedItem = await this.menuModel
      .findByIdAndUpdate(id, updateMenuItemDto, { new: true })
      .exec();
    if (!updatedItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }
    return updatedItem;
   }catch(error){
    throw new Error(`Failed to update menu item: ${error.message}`);
   }
  }

  
  /*
  - Soft delete menu item (set isAvailable to false)
  - Throw error if deletion fails
  - Throw NotFoundException if item not found
  */
  async removeMenuItem(id: string): Promise<Menu> {
    try{
      const item = await this.menuModel
      .findByIdAndUpdate(id, { isAvailable: false }, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }
    return item;
    
  }catch(error){
    throw new Error(`Failed to delete menu item: ${error.message}`);
  }
}

/* 
- Get menu item by ID
- Throw NotFoundException if item not found
- Throw error if retrieval fails
*/
  async findMenuItemById(id: string): Promise<Menu> {
    try{
      const item = await this.menuModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }
    return item;
    }catch(error){
      throw new Error(`Failed to find menu item: ${error.message}`);
    }
  }

    /* 
  - Get all available menu items
  - Throw error if retrieval fails
  */
  async findAllItems(): Promise<Menu[]> {
    try{
      return this.menuModel.find().exec();
    }catch(error){
      throw new Error(`Failed to retrieve menu items: ${error.message}`);
    }
  }

  /*
    ------------------------
    PUBLIC METHODS
    ------------------------
  */

  /* 
  - Get all available menu items
  - Throw error if retrieval fails
  */
  async findAllAvailable(): Promise<Menu[]> {
    try{
      return this.menuModel.find({ isAvailable: true }).exec();
    }catch(error){
      throw new Error(`Failed to retrieve menu items: ${error.message}`);
    }
  }

/*
- Filter by category ['appetizer', 'main', 'dessert', 'beverage']
- Throw error if filtering fails
*/
  async findByCategory(category: string): Promise<Menu[]> {
    try{
      return this.menuModel.find({ category, isAvailable: true }).exec();
    }catch(error){
      throw new Error(`Failed to filter menu items: ${error.message}`);
    }
  }

  /*
  - Search by name or description (case-insensitive, partial matches)
  - Throw error if search fails
  */
  async searchItems(query: string): Promise<Menu[]> {
   try{
     return this.menuModel.find({
      isAvailable: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    }).exec();
   }catch(error){
    throw new Error(`Failed to search menu items: ${error.message}`);
   }
  }
}
