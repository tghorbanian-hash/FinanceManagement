import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface MenuItem {
  id: string;
  parent_id: string | null;
  unique_code: string;
  label_fa: string;
  icon: string;
  menu_type: 'domain' | 'module' | 'section' | 'form';
  route_path: string;
  display_order: number;
  has_badge: boolean;
  children?: MenuItem[];
  fullPath?: string;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  @Input() userPermissions: Set<string> = new Set();
  @Input() isAdmin: boolean = false;

  supabase: SupabaseClient;
  menuData: MenuItem[] = [];
  treeData: MenuItem[] = [];
  favorites: Set<string> = new Set();
  viewMode: 'tree' | 'tile' = 'tree';
  searchTerm: string = '';
  expandedNodes: { [key: string]: boolean } = {};
  loading: boolean = true;

  constructor() {
    // مقداردهی اولیه Supabase (اطلاعات از فایل پیکربندی شما فراخوانی می‌شود)
    this.supabase = (window as any).supabase;
  }

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.loading = true;
    await Promise.all([this.fetchMenus(), this.fetchFavorites()]);
    this.loading = false;
  }

  async fetchMenus() {
    const { data, error } = await this.supabase
      .schema('gen')
      .from('menus')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      this.menuData = data as MenuItem[];
      this.treeData = this.buildTree(this.menuData);
    }
  }

  async fetchFavorites() {
    // در اینجا شناسه کاربر فعلی جایگزین می‌شود
    const userId = 'current-user-uuid'; 
    const { data } = await this.supabase
      .schema('gen')
      .from('user_favorites')
      .select('menu_id');
    
    if (data) {
      this.favorites = new Set(data.map(f => f.menu_id));
    }
  }

  buildTree(items: MenuItem[], parentId: string | null = null): MenuItem[] {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: this.buildTree(items, item.id)
      }));
  }

  toggleNode(id: string) {
    this.expandedNodes[id] = !this.expandedNodes[id];
  }

  async toggleFavorite(event: Event, menuId: string) {
    event.stopPropagation();
    if (this.favorites.has(menuId)) {
      this.favorites.delete(menuId);
      await this.supabase.schema('gen').from('user_favorites').delete().eq('menu_id', menuId);
    } else {
      this.favorites.add(menuId);
      await this.supabase.schema('gen').from('user_favorites').insert({ menu_id: menuId });
    }
  }

  get filteredForms() {
    if (!this.searchTerm) return [];
    return this.menuData.filter(m => 
      m.menu_type === 'form' && 
      (m.label_fa.includes(this.searchTerm) || m.unique_code.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  get favoriteItems() {
    return this.menuData.filter(m => this.favorites.has(m.id));
  }

  setViewMode(mode: 'tree' | 'tile') {
    this.viewMode = mode;
  }
}
