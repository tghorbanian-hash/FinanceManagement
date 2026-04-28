import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createClient } from '@supabase/supabase-js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex h-screen w-full overflow-hidden bg-slate-50" [dir]="'rtl'">
      <aside *ngIf="viewMode === 'tree'" class="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all duration-300">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3 text-indigo-700 font-black">
            <div class="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <span class="text-xl">H</span>
            </div>
            <span class="text-sm">سامانه هوشمند</span>
          </div>
          <button (click)="viewMode = 'tile'" class="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto no-scrollbar p-4">
          <div *ngIf="favorites.size > 0" class="mb-6">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">علاقه‌مندی‌ها</h4>
            <div *ngFor="let fav of favoriteItems" class="flex items-center gap-3 p-2.5 hover:bg-amber-50 rounded-xl text-[13px] text-slate-700 cursor-pointer transition-all border border-transparent hover:border-amber-100 mb-1">
              <span class="text-amber-500">★</span>
              <span class="font-medium">{{ fav.label_fa }}</span>
            </div>
          </div>
          
          <div class="h-px bg-slate-100 mb-6"></div>
          
          <div class="space-y-1">
            <ng-container *ngTemplateOutlet="recursiveMenu; context:{ $implicit: treeData, depth: 0 }"></ng-container>
          </div>
        </div>
      </aside>

      <main class="flex-1 flex flex-col min-w-0">
        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
          <div class="relative w-full max-w-md">
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              placeholder="جستجوی سریع فرم‌ها و کدها..."
              class="w-full h-11 bg-slate-100 border-none rounded-xl text-sm pr-11 pl-4 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>

            <div *ngIf="searchTerm" class="absolute top-full right-0 left-0 mt-3 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div *ngFor="let item of filteredForms" class="p-4 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                <div class="font-bold text-slate-800 text-[14px]">{{ item.label_fa }}</div>
                <div class="text-[10px] text-indigo-400 mt-1 font-mono">{{ item.unique_code }}</div>
              </div>
              <div *ngIf="filteredForms.length === 0" class="p-8 text-center text-slate-400 text-sm">موردی یافت نشد.</div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <button *ngIf="viewMode === 'tile'" (click)="viewMode = 'tree'" class="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
              <span>نمایش درختی</span>
            </button>
            <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 border-2 border-white shadow-sm">U</div>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto p-8">
          <div *ngIf="viewMode === 'tile'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div *ngFor="let domain of treeData" class="bg-white rounded-3xl p-7 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div class="flex items-center gap-5 mb-6">
                <div class="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/></svg>
                </div>
                <h3 class="font-black text-slate-800 text-xl">{{ domain.label_fa }}</h3>
              </div>
              <div class="space-y-3">
                <div *ngFor="let child of domain.children | slice:0:4" class="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer font-medium">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400"></div>
                  {{ child.label_fa }}
                </div>
                <div *ngIf="domain.children.length > 4" class="text-xs text-indigo-400 font-bold mt-4 pt-4 border-t border-slate-50">
                   مشاهده همه {{ domain.children.length }} فرم...
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="viewMode === 'tree'" class="h-full flex flex-col items-center justify-center text-center opacity-30">
             <div class="w-48 h-48 bg-slate-200 rounded-full mb-8 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
             </div>
             <h2 class="text-3xl font-black text-slate-800">آماده شروع فرآیند</h2>
             <p class="text-slate-500 max-w-xs mt-4">فرم مورد نظر را از منوی درختی انتخاب کنید یا جستجو نمایید.</p>
          </div>
        </div>
      </main>
    </div>

    <ng-template #recursiveMenu let-items let-depth="depth">
      <div *ngFor="let node of items" class="mb-0.5">
        <div 
          class="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-xl transition-all group"
          [style.padding-right.px]="depth * 20 + 12"
          [class.hover:bg-slate-50]="node.menu_type !== 'domain'"
          (click)="node.children?.length ? toggleNode(node.id) : null"
        >
          <div *ngIf="node.children?.length" class="transition-transform duration-200" [class.rotate-90]="expandedNodes[node.id]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
          <div *ngIf="!node.children?.length" class="w-3.5"></div>
          
          <span class="flex-1 text-[13px] font-medium" [class.font-black]="depth === 0" [class.text-slate-800]="depth === 0" [class.text-slate-600]="depth > 0">
            {{ node.label_fa }}
          </span>

          <button 
            *ngIf="node.menu_type === 'form'" 
            (click)="toggleFavorite($event, node.id)"
            class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300"
            [class.opacity-100]="favorites.has(node.id)"
            [class.text-amber-500]="favorites.has(node.id)"
          >
            ★
          </button>
        </div>
        <div *ngIf="expandedNodes[node.id] && node.children?.length" class="animate-in slide-in-from-top-1">
          <ng-container *ngTemplateOutlet="recursiveMenu; context:{ $implicit: node.children, depth: depth + 1 }"></ng-container>
        </div>
      </div>
    </ng-template>
  `
})
export class AppComponent implements OnInit {
  menuData = [];
  treeData = [];
  favorites = new Set();
  viewMode = 'tree';
  searchTerm = '';
  expandedNodes = {};

  ngOnInit() {
    this.mockData(); // در این مرحله داده‌های تستی را بارگذاری می‌کنیم
  }

  mockData() {
    this.menuData = [
      { id: '1', parent_id: null, unique_code: 'FIN', label_fa: 'حوزه مالی', menu_type: 'domain', display_order: 1 },
      { id: '2', parent_id: '1', unique_code: 'FIN_GL', label_fa: 'دفتر کل', menu_type: 'module', display_order: 1 },
      { id: '3', parent_id: '2', unique_code: 'GL_VOUCHER', label_fa: 'ثبت سند حسابداری', menu_type: 'form', display_order: 1 },
      { id: '4', parent_id: '1', unique_code: 'FIN_TAX', label_fa: 'امور مالیاتی', menu_type: 'module', display_order: 2 },
      { id: '5', parent_id: null, unique_code: 'HR', label_fa: 'سرمایه انسانی', menu_type: 'domain', display_order: 2 },
      { id: '6', parent_id: '5', unique_code: 'HR_PER', label_fa: 'اطلاعات پرسنلی', menu_type: 'form', display_order: 1 }
    ];
    this.treeData = this.buildTree(this.menuData);
  }

  buildTree(items, parentId = null) {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: this.buildTree(items, item.id)
      }));
  }

  toggleNode(id) {
    this.expandedNodes[id] = !this.expandedNodes[id];
  }

  toggleFavorite(event, id) {
    event.stopPropagation();
    if (this.favorites.has(id)) this.favorites.delete(id);
    else this.favorites.add(id);
  }

  get favoriteItems() {
    return this.menuData.filter(m => this.favorites.has(m.id));
  }

  get filteredForms() {
    if (!this.searchTerm) return [];
    return this.menuData.filter(m => 
      m.menu_type === 'form' && m.label_fa.includes(this.searchTerm)
    );
  }
}
