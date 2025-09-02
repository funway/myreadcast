'use server';

import { revalidatePath } from 'next/cache';
import { Library } from '@/lib/server/db/library';
import { createLibrary, updateLibrary, deleteLibrary, getAllLibraries, addFolderToLibrary } from '@/lib/server/db/library';
import { logger } from '@/lib/server/logger';
import { ActionResult } from '@/lib/shared/types';

export async function createLibraryAction(formData: FormData): Promise<ActionResult<Library>> {
  try {
    const name = formData.get('name') as string;
    const icon = formData.get('icon') as string;
    const folders = formData.get('folders') as string; // JSON 字符串
    
    if (!name?.trim()) {
      return { success: false, message: '媒体库名称不能为空' };
    }
    
    const newLib = {
      name: name.trim(),
      icon: icon,
      folders: folders ? JSON.parse(folders) : [],
    };
    logger.debug('Create new library:', newLib);

    const library = await createLibrary(newLib);
    
    revalidatePath('/admin/libraries');
    
    return { success: true, data: library };
  } catch (error) {
    logger.error('Create library error:', error);
    return { success: false, message: '创建媒体库失败' };
  }
}

export async function updateLibraryAction(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const icon = formData.get('icon') as string;
    const folders = formData.get('folders') as string; // JSON 字符串
    
    if (!name?.trim()) {
      return { success: false, message: '媒体库名称不能为空' };
    }
    
    const library = await updateLibrary({
      id: id,
      name: name.trim(),
      icon: icon,
      folders: folders ? JSON.parse(folders) : [],
    });
    if (!library) {
      return { success: false, message: '媒体库不存在' };
    }
    
    revalidatePath('/admin/libraries');
    return { success: true, data: library };
  } catch (error) {
    logger.error('Update library error:', error);
    return { success: false, message: '更新媒体库失败' };
  }
}

export async function deleteLibraryAction(id: string) {
  try {
    const library = await deleteLibrary(id);
    if (!library) {
      return { success: false, message: '媒体库不存在' };
    }
    
    revalidatePath('/admin/libraries');
    return { success: true, data: library };
  } catch (error) {
    logger.error('Delete library error:', error);
    return { success: false, message: '删除媒体库失败' };
  }
}

export async function addFolderAction(libraryId: string, folderPath: string) {
  try {
    const library = await addFolderToLibrary(libraryId, folderPath);
    if (!library) {
      return { success: false, message: '媒体库不存在' };
    }
    
    revalidatePath('/admin/libraries');
    return { success: true, data: library };
  } catch (error) {
    logger.error('Add folder error:', error);
    return { success: false, message: '添加文件夹失败' };
  }
}

export async function scanLibraryAction(libraryId: string) {
  try {
    // 这里实现扫描逻辑
    // 例如：扫描文件夹，更新书籍记录
    // await scanLibraryFiles(libraryId);
    
    // 模拟扫描过程
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    revalidatePath('/admin/libraries');
    return { 
      success: true, 
      message: '扫描完成',
      data: { libraryId, scannedAt: new Date() }
    };
  } catch (error) {
    logger.error('Scan library error:', error);
    return { success: false, message: '扫描失败，请重试' };
  }
}


// 用于服务端组件的数据获取
export async function getLibrariesData(): Promise<Library[]> {
  try {
    const libraries = await getAllLibraries();
    return libraries;
  } catch (error) {
    logger.error('Get libraries error:', error);
    return [];
  }
}
