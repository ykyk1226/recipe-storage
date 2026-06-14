'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, Sparkles, Heart, Tag, X, PlusCircle, Calendar, PanelLeftClose } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface SidebarProps {
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (id: string) => void;
  onlyFavorites: boolean;
  onToggleFavorites: () => void;
  ingredientFilters: string[];
  onAddIngredient: (name: string) => void;
  onRemoveIngredient: (name: string) => void;
  activeTab: 'list' | 'create' | 'ai-import' | 'planner';
  setActiveTab: (tab: 'list' | 'create' | 'ai-import' | 'planner') => void;
  onCollapse?: () => void;
}

export default function Sidebar({
  categories,
  selectedCategories,
  onToggleCategory,
  onlyFavorites,
  onToggleFavorites,
  ingredientFilters,
  onAddIngredient,
  onRemoveIngredient,
  activeTab,
  setActiveTab,
  onCollapse,
}: SidebarProps) {
  const [ingInput, setIngInput] = useState('');

  const handleAddIng = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = ingInput.trim();
    if (cleanInput && !ingredientFilters.includes(cleanInput)) {
      onAddIngredient(cleanInput);
      setIngInput('');
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen overflow-y-auto shrink-0 select-none">
      {/* App Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary-green text-white rounded-lg">
            <BookOpen size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Recipe Storage</h1>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
            title="メニューを閉じる"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-1">
        <button
          onClick={() => setActiveTab('list')}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'list'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <BookOpen size={18} />
          <span>レシピ一覧</span>
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'planner'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Calendar size={18} />
          <span>献立カレンダー</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'create'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Plus size={18} />
          <span>レシピ新規登録</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-import')}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ai-import'
              ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/50'
              : 'text-indigo-600 hover:bg-indigo-50/50'
          }`}
        >
          <Sparkles size={18} className="text-indigo-500" />
          <span>AIインポート</span>
        </button>
      </div>

      <hr className="border-slate-100 my-2" />

      {/* Quick Filters */}
      <div className="p-4 space-y-6">
        {/* Favorites */}
        <div>
          <button
            onClick={onToggleFavorites}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
              onlyFavorites
                ? 'bg-amber-50 border-amber-200 text-amber-800 font-medium'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Heart size={16} className={onlyFavorites ? 'fill-amber-500 text-amber-500' : ''} />
              <span className="text-sm">お気に入りのみ</span>
            </div>
            {onlyFavorites && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-slate-400 px-1">
            <Tag size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">カテゴリ</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto px-1">
            {categories.map((category) => {
              const isChecked = selectedCategories.includes(category.id);
              return (
                <label
                  key={category.id}
                  className="flex items-center space-x-3 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer select-none text-sm text-slate-700 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleCategory(category.id)}
                    className="w-4 h-4 text-primary-green border-slate-300 rounded focus:ring-primary-green focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className={isChecked ? 'font-medium text-slate-900' : 'text-slate-600'}>
                      {category.name}
                    </span>
                  </div>
                </label>
              );
            })}
            {categories.length === 0 && (
              <p className="text-xs text-slate-400 italic p-2">カテゴリがありません</p>
            )}
          </div>
        </div>

        {/* Ingredient Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-slate-400 px-1">
            <div className="flex items-center space-x-2">
              <BookOpen size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">冷蔵庫の食材で絞り込み</span>
            </div>
          </div>

          {/* Form input */}
          <form onSubmit={handleAddIng} className="flex items-center space-x-2">
            <input
              type="text"
              value={ingInput}
              onChange={(e) => setIngInput(e.target.value)}
              placeholder="材料名 (例: 豚肉)"
              className="flex-1 min-w-0 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green bg-slate-50/50"
            />
            <button
              type="submit"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all shrink-0"
              title="材料を追加"
            >
              <PlusCircle size={18} />
            </button>
          </form>

          {/* Tag list */}
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto py-1">
            {ingredientFilters.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200/60 font-medium"
              >
                <span>{ing}</span>
                <button
                  type="button"
                  onClick={() => onRemoveIngredient(ing)}
                  className="ml-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {ingredientFilters.length === 0 && (
              <p className="text-xs text-slate-400 italic p-1">材料による絞り込みはありません</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
