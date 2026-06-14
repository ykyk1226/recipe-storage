'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, RefreshCw, PanelLeftOpen, PanelRightOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ShoppingList from '@/components/ShoppingList';
import RecipeCard from '@/components/RecipeCard';
import RecipeDetailDrawer from '@/components/RecipeDetailDrawer';
import RecipeForm from '@/components/RecipeForm';
import AIImportView from '@/components/AIImportView';
import MealPlannerView from '@/components/MealPlannerView';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function Home() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'ai-import' | 'planner'>('list');
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);

  // Collapsible panels states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isShoppingListCollapsed, setIsShoppingListCollapsed] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Data States
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Shopping Lists & Items States
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');
  const [shoppingItems, setShoppingItems] = useState<any[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [ingredientFilters, setIngredientFilters] = useState<string[]>([]);

  // Loading States
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingShopping, setLoadingShopping] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Shopping Lists (Parent Lists) - Independent of activeListId!
  const fetchShoppingLists = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping/lists');
      if (res.ok) {
        const data = await res.json();
        setShoppingLists(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch shopping lists:', err);
    }
    return [];
  }, []);

  // Initial load of lists and select the first one
  useEffect(() => {
    const initLists = async () => {
      const data = await fetchShoppingLists();
      if (data && data.length > 0 && !activeListId) {
        setActiveListId(data[0].id);
      }
    };
    initLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchShoppingLists]);

  // Fetch Shopping Items for the active list
  const fetchShoppingItems = useCallback(async () => {
    if (!activeListId) {
      setShoppingItems([]);
      return;
    }
    setLoadingShopping(true);
    try {
      const res = await fetch(`/api/shopping?listId=${activeListId}`);
      if (res.ok) {
        const data = await res.json();
        setShoppingItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch shopping items:', err);
    } finally {
      setLoadingShopping(false);
    }
  }, [activeListId]);

  useEffect(() => {
    fetchShoppingItems();
  }, [fetchShoppingItems]);

  // Fetch Recipes based on filters
  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
      if (onlyFavorites) params.append('favorite', 'true');
      if (ingredientFilters.length > 0) params.append('ingredients', ingredientFilters.join(','));

      const res = await fetch(`/api/recipes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
        
        // If a recipe is currently selected, refresh its details too
        if (selectedRecipe) {
          const updatedSelected = data.find((r: any) => r.id === selectedRecipe.id);
          if (updatedSelected) {
            setSelectedRecipe(updatedSelected);
          } else {
            setSelectedRecipe(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    } finally {
      setLoadingRecipes(false);
    }
  }, [debouncedSearchQuery, selectedCategories, onlyFavorites, ingredientFilters, selectedRecipe]);

  useEffect(() => {
    fetchRecipes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, selectedCategories, onlyFavorites, ingredientFilters]);

  // Handle Recipe Form Submit (Create & Update)
  const handleSubmitRecipe = async (formData: any) => {
    try {
      const url = editingRecipe ? `/api/recipes/${editingRecipe.id}` : '/api/recipes';
      const method = editingRecipe ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        await fetchRecipes();
        
        if (editingRecipe) {
          setSelectedRecipe(data);
          setEditingRecipe(null);
        } else {
          setActiveTab('list');
        }
      } else {
        const errData = await res.json();
        alert(`エラー: ${errData.error || '保存に失敗しました'}`);
      }
    } catch (err) {
      console.error('Failed to submit recipe:', err);
      alert('通信エラーが発生しました');
    }
  };

  // Handle Recipe Delete
  const handleDeleteRecipe = async (id: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedRecipe(null);
        setEditingRecipe(null);
        await fetchRecipes();
      }
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  // Handle Card Favorite Toggle
  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: isFav }),
      });
      if (res.ok) {
        await fetchRecipes();
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Parent Lists Callbacks
  const handleAddShoppingList = async (name: string) => {
    try {
      const res = await fetch('/api/shopping/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newList = await res.json();
        await fetchShoppingLists(); // Refresh lists list in state first
        setActiveListId(newList.id); // Then set active to new list
      }
    } catch (err) {
      console.error('Failed to create shopping list:', err);
    }
  };

  const handleUpdateShoppingList = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/shopping/lists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });
      if (res.ok) {
        await fetchShoppingLists();
      }
    } catch (err) {
      console.error('Failed to update shopping list:', err);
    }
  };

  const handleDeleteShoppingList = async (id: string) => {
    try {
      const res = await fetch(`/api/shopping/lists?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remainingLists = shoppingLists.filter((l) => l.id !== id);
        if (remainingLists.length > 0) {
          setActiveListId(remainingLists[0].id);
        } else {
          setActiveListId('');
        }
        await fetchShoppingLists();
      }
    } catch (err) {
      console.error('Failed to delete shopping list:', err);
    }
  };

  // Add items to the Active Shopping List
  const handleAddIngredientsToShopping = async (items: Array<{ name: string; amount: string; unit: string; recipeId?: string }>) => {
    if (!activeListId) {
      alert('買い物リストを選択または作成してください');
      return;
    }
    try {
      const payload = items.map(item => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        recipeId: item.recipeId || selectedRecipe?.id || null,
        shoppingListId: activeListId,
      }));

      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchShoppingItems();
        await fetchShoppingLists(); // Refresh counts
      }
    } catch (err) {
      console.error('Failed to add to shopping list:', err);
    }
  };

  // Shopping List Items Actions
  const handleToggleShoppingItem = async (itemId: string, isChecked: boolean) => {
    try {
      const res = await fetch('/api/shopping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, isChecked }),
      });
      if (res.ok) {
        await fetchShoppingItems();
      }
    } catch (err) {
      console.error('Failed to toggle shopping item:', err);
    }
  };

  const handleAddShoppingItem = async (name: string, amount: string, unit: string) => {
    if (!activeListId) return;
    try {
      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount, unit, shoppingListId: activeListId }),
      });
      if (res.ok) {
        await fetchShoppingItems();
        await fetchShoppingLists(); // Refresh counts
      }
    } catch (err) {
      console.error('Failed to add shopping item:', err);
    }
  };

  const handleDeleteShoppingItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/shopping?id=${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchShoppingItems();
        await fetchShoppingLists(); // Refresh counts
      }
    } catch (err) {
      console.error('Failed to delete shopping item:', err);
    }
  };

  const handleClearCheckedShoppingItems = async () => {
    if (!activeListId) return;
    try {
      const res = await fetch(`/api/shopping?clearChecked=true&listId=${activeListId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchShoppingItems();
        await fetchShoppingLists(); // Refresh counts
      }
    } catch (err) {
      console.error('Failed to clear checked shopping items:', err);
    }
  };

  const executeClearAllShoppingItems = async () => {
    setIsClearConfirmOpen(false);
    if (!activeListId) return;
    try {
      const res = await fetch(`/api/shopping?clearAll=true&listId=${activeListId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchShoppingItems();
        await fetchShoppingLists(); // Refresh counts
      }
    } catch (err) {
      console.error('Failed to clear all shopping items:', err);
    }
  };

  const handleClearAllShoppingItems = () => {
    if (!activeListId) return;
    setIsClearConfirmOpen(true);
  };

  // Sidebar Filter callbacks
  const handleToggleCategoryFilter = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleAddIngredientFilter = (name: string) => {
    setIngredientFilters((prev) => [...prev, name]);
  };

  const handleRemoveIngredientFilter = (name: string) => {
    setIngredientFilters((prev) => prev.filter((n) => n !== name));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 relative">
      {/* Floating Panel Open Buttons */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-6 h-24 bg-primary-green hover:bg-emerald-600 text-white rounded-r-2xl shadow-lg border-y border-r border-emerald-700/20 transition-all hover:w-8 active:scale-95 cursor-pointer flex items-center justify-center group"
          title="メニューを開く"
        >
          <ChevronRight size={16} className="group-hover:scale-120 transition-transform" />
        </button>
      )}

      {isShoppingListCollapsed && (
        <button
          onClick={() => setIsShoppingListCollapsed(false)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-6 h-24 bg-primary-green hover:bg-emerald-600 text-white rounded-l-2xl shadow-lg border-y border-l border-emerald-700/20 transition-all hover:w-8 active:scale-95 cursor-pointer flex items-center justify-center group"
          title="お買い物リストを開く"
        >
          <ChevronLeft size={16} className="group-hover:scale-120 transition-transform" />
        </button>
      )}

      {/* 1. Left Sidebar */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 bg-white h-screen ${
        isSidebarCollapsed ? 'w-0' : 'w-64 border-r border-slate-200'
      }`}>
        <Sidebar
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategoryFilter}
          onlyFavorites={onlyFavorites}
          onToggleFavorites={() => setOnlyFavorites(!onlyFavorites)}
          ingredientFilters={ingredientFilters}
          onAddIngredient={handleAddIngredientFilter}
          onRemoveIngredient={handleRemoveIngredientFilter}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'list' && tab !== 'planner') {
              setSelectedRecipe(null);
              setEditingRecipe(null);
            }
          }}
          onCollapse={() => setIsSidebarCollapsed(true)}
        />
      </div>

      {/* 2. Middle Main Content Area */}
      <main className="flex-grow flex flex-col h-full overflow-hidden bg-slate-50/50 transition-all duration-300">
        {activeTab === 'list' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left part of Middle column - Recipe Grid */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6">
              {/* Search Bar */}
              <div className="relative shrink-0 select-none">
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="レシピ名、キーワード、材料名からレシピを検索..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green shadow-sm text-sm"
                />
              </div>

              {/* Recipe grid list container */}
              <div className="flex-1 overflow-y-auto pr-1">
                {loadingRecipes ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
                    <RefreshCw className="animate-spin text-primary-green" size={28} />
                    <span className="text-sm font-medium">レシピを読み込み中...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
                      {recipes.map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          recipe={recipe}
                          onCardClick={() => {
                            setSelectedRecipe(recipe);
                            setEditingRecipe(null);
                          }}
                          onToggleFavorite={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(recipe.id, !recipe.isFavorite);
                          }}
                        />
                      ))}
                    </div>

                    {recipes.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-3 border border-dashed border-slate-200 rounded-2xl bg-white/50 select-none">
                        <BookOpen size={40} className="stroke-1 text-slate-300" />
                        <div className="text-center space-y-1">
                          <p className="text-sm font-semibold text-slate-600">合致するレシピが見つかりません</p>
                          <p className="text-xs text-slate-400">検索条件やフィルターを変更してみてください</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right part of Middle column - Split details drawer */}
            {selectedRecipe && !editingRecipe && (
              <RecipeDetailDrawer
                recipe={selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
                onEdit={() => setEditingRecipe(selectedRecipe)}
                onDelete={handleDeleteRecipe}
                onToggleFavorite={(id, isFav) => handleToggleFavorite(id, isFav)}
                onAddIngredientsToShopping={handleAddIngredientsToShopping}
              />
            )}

            {/* Split edit form */}
            {editingRecipe && (
              <div className="w-[520px] border-l border-slate-200 bg-white h-screen overflow-y-auto p-4 shadow-2xl z-20 animate-in slide-in-from-right duration-300">
                <RecipeForm
                  categories={categories}
                  initialData={editingRecipe}
                  onSubmit={handleSubmitRecipe}
                  onCancel={() => setEditingRecipe(null)}
                  isDrawer={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Manual */}
        {activeTab === 'create' && (
          <div className="flex-1 overflow-y-auto p-6">
            <RecipeForm
              categories={categories}
              initialData={null}
              onSubmit={handleSubmitRecipe}
              onCancel={() => setActiveTab('list')}
            />
          </div>
        )}

        {/* Tab 3: AI Import */}
        {activeTab === 'ai-import' && (
          <div className="flex-1 overflow-y-auto p-6">
            <AIImportView
              categories={categories}
              onSubmitParsedRecipe={handleSubmitRecipe}
              onCancel={() => setActiveTab('list')}
            />
          </div>
        )}

        {/* Tab 4: Meal Planner */}
        {activeTab === 'planner' && (
          <div className="flex-1 flex overflow-hidden">
            <MealPlannerView
              recipes={recipes}
              onRecipeClick={(recipe) => {
                setSelectedRecipe(recipe);
              }}
              onAddIngredientsToShopping={handleAddIngredientsToShopping}
              activeListName={shoppingLists.find(l => l.id === activeListId)?.name}
            />

            {/* Right part of Middle column - Split details drawer */}
            {selectedRecipe && !editingRecipe && (
              <RecipeDetailDrawer
                recipe={selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
                onEdit={() => setEditingRecipe(selectedRecipe)}
                onDelete={handleDeleteRecipe}
                onToggleFavorite={(id, isFav) => handleToggleFavorite(id, isFav)}
                onAddIngredientsToShopping={handleAddIngredientsToShopping}
              />
            )}

            {/* Split edit form */}
            {editingRecipe && (
              <div className="w-[520px] border-l border-slate-200 bg-white h-screen overflow-y-auto p-4 shadow-2xl z-20 animate-in slide-in-from-right duration-300">
                <RecipeForm
                  categories={categories}
                  initialData={editingRecipe}
                  onSubmit={handleSubmitRecipe}
                  onCancel={() => setEditingRecipe(null)}
                  isDrawer={true}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Right Shopping List */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 bg-white h-screen ${
        isShoppingListCollapsed ? 'w-0' : 'w-80 border-l border-slate-200'
      }`}>
        <ShoppingList
          items={shoppingItems}
          lists={shoppingLists}
          activeListId={activeListId}
          onListChange={setActiveListId}
          onAddList={handleAddShoppingList}
          onUpdateList={handleUpdateShoppingList}
          onDeleteList={handleDeleteShoppingList}
          onToggleItem={handleToggleShoppingItem}
          onAddItem={handleAddShoppingItem}
          onDeleteItem={handleDeleteShoppingItem}
          onClearChecked={handleClearCheckedShoppingItems}
          onClearAll={handleClearAllShoppingItems}
          loading={loadingShopping}
          onCollapse={() => setIsShoppingListCollapsed(true)}
        />
      </div>

      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="お買い物リストのクリア"
        message="このお買い物リスト内のアイテムをすべてクリアしてよろしいですか？"
        confirmLabel="クリアする"
        cancelLabel="キャンセル"
        isDestructive={true}
        onConfirm={executeClearAllShoppingItems}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
}
