import { Category, MenuItem, AppSettings } from './types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  whatsappNumber: "5581998371952",
  shareUrl: "" // Se vazio, usa a URL atual do navegador
};

export const STORAGE_KEYS = {
  MENU: 'vafc_menu_v2',
  SETTINGS: 'vafc_settings_v1'
};