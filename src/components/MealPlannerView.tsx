'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Search, 
  X, 
  Clock, 
  Utensils, 
  Check, 
  Loader2,
  BookOpen 
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Recipe {
  id: string;
  title: string;
  image: string | null;
  prepTime: number | null;
  cookTime: number | null;
  ingredients: Ingredient[];
  categories: Category[];
}

interface MealPlan {
  id: string;
  date: string;
  mealType: string;
  recipeId: string;
  recipe: Recipe;
}

interface MealPlannerViewProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onAddIngredientsToShopping: (items: Array<{ name: string; amount: string; unit: string; recipeId?: string }>) => Promise<void>;
  activeListName?: string;
}

const MEAL_TYPES = ['朝食', '昼食', '夕食', 'その他'] as const;
type MealType = typeof MEAL_TYPES[number];

// Helper to sum and merge ingredient amounts
const sumAmounts = (amounts: string[]): string => {
  const cleanAmounts = amounts
    .map((a) => a.trim())
    .filter((a) => a !== '');

  if (cleanAmounts.length === 0) return '';
  if (cleanAmounts.length === 1) return cleanAmounts[0];

  let total = 0;
  let canSum = true;

  for (const amt of cleanAmounts) {
    // Check for simple number (e.g. 100, 1.5)
    if (/^\d+(\.\d+)?$/.test(amt)) {
      total += parseFloat(amt);
    } 
    // Check for simple fraction (e.g. 1/2, 3/4)
    else if (/^\d+\/\d+$/.test(amt)) {
      const [num, den] = amt.split('/').map(Number);
      if (den !== 0) {
        total += num / den;
      } else {
        canSum = false;
        break;
      }
    } 
    // Cannot easily parse
    else {
      canSum = false;
      break;
    }
  }

  if (canSum) {
    if (Number.isInteger(total)) {
      return String(total);
    }
    // Round to maximum of 2 decimal places
    return String(Math.round(total * 100) / 100);
  }

  // Fallback: join with ' + '
  return cleanAmounts.join(' + ');
};

// Helper to combine duplicate ingredients
const combineIngredients = (
  items: Array<{ name: string; amount: string; unit: string; recipeId?: string }>
) => {
  const grouped: { [key: string]: typeof items } = {};

  items.forEach((item) => {
    const nameKey = item.name.trim();
    const unitKey = item.unit.trim();
    const key = `${nameKey}__${unitKey}`;

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  const combinedItems: Array<{ name: string; amount: string; unit: string; recipeId?: string }> = [];

  Object.keys(grouped).forEach((key) => {
    const group = grouped[key];
    const firstItem = group[0];

    if (group.length === 1) {
      combinedItems.push(firstItem);
      return;
    }

    const amounts = group.map((g) => g.amount);
    const combinedAmount = sumAmounts(amounts);

    combinedItems.push({
      name: firstItem.name,
      amount: combinedAmount,
      unit: firstItem.unit,
      recipeId: undefined, // Clear specific recipe reference since it's merged
    });
  });

  return combinedItems;
};

// Utility to format date as YYYY-MM-DD
const formatDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Utility to get Sunday of the week
const getSunday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay(); // Sunday is 0, Monday is 1, etc.
  const diff = date.getDate() - day; // Subtract day index to get back to Sunday
  const sunday = new Date(date.setDate(diff));
  sunday.setHours(0, 0, 0, 0);
  return sunday;
};

export default function MealPlannerView({
  recipes,
  onRecipeClick,
  onAddIngredientsToShopping,
  activeListName = 'お買い物リスト',
}: MealPlannerViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getSunday(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; mealType: MealType } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Feedback states
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Delete confirm states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [mealPlanIdToDelete, setMealPlanIdToDelete] = useState<string | null>(null);

  // Generate 7 days of the current week
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(currentWeekStart);
    day.setDate(currentWeekStart.getDate() + i);
    return day;
  });

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);

  // Fetch meal plans for the current week
  const fetchMealPlans = async () => {
    setLoading(true);
    try {
      const startStr = formatDateString(currentWeekStart);
      const endStr = formatDateString(weekEnd);
      const res = await fetch(`/api/meal-plans?startDate=${startStr}&endDate=${endStr}`);
      if (res.ok) {
        const data = await res.json();
        setMealPlans(data);
      } else {
        console.error('Failed to fetch meal plans');
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMealPlans();
  }, [currentWeekStart]);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Navigate weeks
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleToday = () => {
    setCurrentWeekStart(getSunday(new Date()));
  };

  // Add meal plan
  const handleAddMeal = async (recipeId: string) => {
    if (!selectedSlot) return;

    try {
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formatDateString(selectedSlot.date),
          mealType: selectedSlot.mealType,
          recipeId,
        }),
      });

      if (res.ok) {
        showToast('献立に追加しました。');
        await fetchMealPlans();
        setIsModalOpen(false);
      } else {
        const errorData = await res.json();
        showToast(errorData.error || '献立の追加に失敗しました。', 'error');
      }
    } catch (error) {
      console.error('Failed to add meal plan:', error);
      showToast('通信エラーが発生しました。', 'error');
    }
  };

  // Delete meal plan (opens confirmation dialog)
  const handleDeleteMeal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening recipe detail
    setMealPlanIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  // Performs actual delete meal plan operation
  const executeDeleteMeal = async () => {
    if (!mealPlanIdToDelete) return;
    setIsDeleteConfirmOpen(false);

    try {
      const res = await fetch(`/api/meal-plans?id=${mealPlanIdToDelete}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('献立を削除しました。');
        await fetchMealPlans();
      } else {
        showToast('削除に失敗しました。', 'error');
      }
    } catch (error) {
      console.error('Failed to delete meal plan:', error);
      showToast('通信エラーが発生しました。', 'error');
    } finally {
      setMealPlanIdToDelete(null);
    }
  };

  // Add all ingredients for a given day to shopping list
  const handleAddDayToShopping = async (day: Date) => {
    const dayStr = formatDateString(day);
    const dayPlans = mealPlans.filter(p => formatDateString(new Date(p.date)) === dayStr);

    if (dayPlans.length === 0) {
      showToast('この日の献立にはレシピが登録されていません。', 'error');
      return;
    }

    const itemsToAdd: Array<{ name: string; amount: string; unit: string; recipeId?: string }> = [];
    dayPlans.forEach(plan => {
      plan.recipe.ingredients.forEach(ing => {
        itemsToAdd.push({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          recipeId: plan.recipe.id,
        });
      });
    });

    try {
      const combinedItems = combineIngredients(itemsToAdd);
      await onAddIngredientsToShopping(combinedItems);
      showToast(`${day.getMonth() + 1}/${day.getDate()}の食材を「${activeListName}」に追加しました！`);
    } catch (error) {
      console.error(error);
      showToast('材料の追加に失敗しました。', 'error');
    }
  };

  // Add all ingredients for the entire week to shopping list
  const handleAddWeekToShopping = async () => {
    if (mealPlans.length === 0) {
      showToast('この週の献立にはレシピが登録されていません。', 'error');
      return;
    }

    const itemsToAdd: Array<{ name: string; amount: string; unit: string; recipeId?: string }> = [];
    mealPlans.forEach(plan => {
      plan.recipe.ingredients.forEach(ing => {
        itemsToAdd.push({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          recipeId: plan.recipe.id,
        });
      });
    });

    try {
      const combinedItems = combineIngredients(itemsToAdd);
      await onAddIngredientsToShopping(combinedItems);
      showToast(`この週の全食材を「${activeListName}」に追加しました！`);
    } catch (error) {
      console.error(error);
      showToast('材料の追加に失敗しました。', 'error');
    }
  };

  // Get meal plans for a specific date and type
  const getPlansForSlot = (date: Date, type: MealType) => {
    const dateStr = formatDateString(date);
    return mealPlans.filter(
      (p) => formatDateString(new Date(p.date)) === dateStr && p.mealType === type
    );
  };

  // Format Japanese Day name
  const getJpDayName = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Filter recipes inside the Modal
  const filteredRecipes = recipes.filter(r => {
    const query = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(query) ||
      r.categories.some(c => c.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-top duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 select-none bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center space-x-2">
            <Calendar className="text-primary-green" size={22} />
            <span>献立カレンダー</span>
          </h2>
          <p className="text-xs text-slate-500">
            日々の献立を計画し、必要な材料をワンクリックでお買い物リストへ追加します。
          </p>
        </div>

        {/* Navigation & Week label */}
        <div className="flex items-center space-x-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200/40">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-all"
            title="前週"
          >
            <ChevronLeft size={16} />
          </button>
          
          <button
            onClick={handleToday}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold shadow-sm border border-slate-200/50 transition-all"
          >
            今週
          </button>

          <span className="text-xs font-bold text-slate-700 px-1">
            {currentWeekStart.getFullYear()}年{currentWeekStart.getMonth() + 1}月{currentWeekStart.getDate()}日
            ～ {weekEnd.getMonth() + 1}月{weekEnd.getDate()}日
          </span>

          <button
            onClick={handleNextWeek}
            className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-all"
            title="翌週"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAddWeekToShopping}
          disabled={mealPlans.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-green hover:bg-primary-green-hover text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
        >
          <ShoppingBag size={16} />
          <span>この週の全材料を買い物リストへ</span>
        </button>
      </div>

      {/* Week Calendar Grid Container */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 space-y-3">
            <Loader2 className="animate-spin text-primary-green" size={28} />
            <span className="text-sm font-medium">献立データを読み込み中...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {weekDays.map((day) => {
              const dayStr = formatDateString(day);
              const isDayToday = isToday(day);
              const dayPlans = mealPlans.filter(p => formatDateString(new Date(p.date)) === dayStr);

              return (
                <div 
                  key={dayStr}
                  className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row gap-4 ${
                    isDayToday ? 'border-primary-green ring-1 ring-primary-green/20 bg-emerald-50/5' : 'border-slate-200/80'
                  }`}
                >
                  {/* Left Column: Date Info */}
                  <div className="w-full lg:w-44 shrink-0 flex flex-row lg:flex-col justify-between items-center lg:items-start lg:border-r border-slate-100 lg:pr-4 py-2">
                    <div className="flex flex-row lg:flex-col items-center lg:items-start gap-3 lg:gap-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-sm shrink-0 ${
                          isDayToday 
                            ? 'bg-primary-green text-white ring-4 ring-emerald-100' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {day.getDate()}
                        </div>
                        <div className="flex flex-col select-none">
                          <span className="text-sm font-bold text-slate-800 leading-tight">
                            {getJpDayName(day)}曜日
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {day.getMonth() + 1}月
                          </span>
                        </div>
                      </div>
                      {isDayToday && (
                        <span className="px-2 py-0.5 bg-primary-green/10 text-primary-green text-[10px] font-bold rounded-full border border-primary-green/20 self-start lg:mt-1">
                          今日
                        </span>
                      )}
                    </div>

                    {/* Day-specific Shopping integration */}
                    <button
                      onClick={() => handleAddDayToShopping(day)}
                      disabled={dayPlans.length === 0}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-semibold border border-slate-200/60 transition-all disabled:opacity-55 disabled:cursor-not-allowed mt-0 lg:mt-3"
                      title="この日のすべての食材を買い物リストに追加"
                    >
                      <Plus size={12} />
                      <span>材料をリストへ</span>
                    </button>
                  </div>

                  {/* Right Column: 4 Meal slots stacked vertically */}
                  <div className="flex-1 space-y-3">
                    {MEAL_TYPES.map((type) => {
                      const slotPlans = getPlansForSlot(day, type);

                      return (
                        <div 
                          key={type}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0"
                        >
                          {/* Slot Label (e.g. 朝食, 昼食) */}
                          <div className="sm:w-20 shrink-0 select-none">
                            <span className="inline-block text-xs font-bold text-slate-400 bg-slate-100/70 px-2.5 py-1 rounded-md">
                              {type}
                            </span>
                          </div>

                          {/* List of recipes & Add button in a row */}
                          <div className="flex-grow flex flex-wrap items-center gap-2">
                            {slotPlans.map((plan) => (
                              <div
                                key={plan.id}
                                onClick={() => onRecipeClick(plan.recipe)}
                                className="group relative bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2 pr-8 shadow-xs hover:border-primary-green/45 hover:shadow-xs transition-all cursor-pointer flex items-center space-x-3 w-64 shrink-0"
                              >
                                {/* Mini Image */}
                                {plan.recipe.image ? (
                                  <img 
                                    src={plan.recipe.image} 
                                    alt={plan.recipe.title}
                                    className="w-10 h-10 object-cover rounded-lg bg-slate-100 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                                    <Utensils size={16} />
                                  </div>
                                )}

                                {/* Title & Stats */}
                                <div className="flex-grow min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate leading-snug" title={plan.recipe.title}>
                                    {plan.recipe.title}
                                  </p>
                                  {/* Categories indicator */}
                                  <div className="flex items-center space-x-1.5 mt-1">
                                    {plan.recipe.categories.slice(0, 2).map((cat) => (
                                      <span 
                                        key={cat.id} 
                                        className="w-2.5 h-2.5 rounded-full inline-block"
                                        style={{ backgroundColor: cat.color }}
                                        title={cat.name}
                                      />
                                    ))}
                                    {(plan.recipe.prepTime || plan.recipe.cookTime) && (
                                      <span className="text-[9px] text-slate-400 font-medium flex items-center space-x-0.5 ml-1">
                                        <Clock size={8} />
                                        <span>
                                          {((plan.recipe.prepTime || 0) + (plan.recipe.cookTime || 0))}分
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Delete button on hover/group */}
                                <button
                                  onClick={(e) => handleDeleteMeal(plan.id, e)}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                  title="削除"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}

                            {/* Add meal button */}
                            <button
                              onClick={() => {
                                setSelectedSlot({ date: day, mealType: type });
                                setIsModalOpen(true);
                                setSearchQuery('');
                              }}
                              className="inline-flex items-center justify-center space-x-1 px-3 py-2 border border-dashed border-slate-200 hover:border-primary-green hover:bg-emerald-50/10 text-slate-400 hover:text-primary-green rounded-xl text-xs font-semibold transition-all cursor-pointer bg-white h-10 shrink-0"
                            >
                              <Plus size={12} />
                              <span>{slotPlans.length > 0 ? '追加' : 'レシピを追加'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipe Select Modal */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center select-none">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  レシピを献立に追加
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedSlot.date.getMonth() + 1}月{selectedSlot.date.getDate()}日 ({getJpDayName(selectedSlot.date)}) - {selectedSlot.mealType}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="レシピ名、カテゴリで絞り込み..."
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green text-xs"
                />
              </div>
            </div>

            {/* Recipes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => handleAddMeal(recipe.id)}
                  className="group flex items-center space-x-3 p-2.5 rounded-xl border border-slate-200/80 hover:border-primary-green/50 hover:bg-emerald-50/5 transition-all cursor-pointer"
                >
                  {recipe.image ? (
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-12 h-12 object-cover rounded-lg bg-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                      <Utensils size={20} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-primary-green transition-all">
                      {recipe.title}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {recipe.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      ))}
                      {(recipe.prepTime || recipe.cookTime) && (
                        <span className="text-[9px] text-slate-400 font-semibold flex items-center space-x-0.5 self-center">
                          <Clock size={8} />
                          <span>
                            {((recipe.prepTime || 0) + (recipe.cookTime || 0))}分
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 text-[10px] font-bold text-slate-500 group-hover:bg-primary-green group-hover:text-white bg-slate-100 rounded-lg transition-all shrink-0">
                    追加
                  </span>
                </div>
              ))}

              {filteredRecipes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                  <BookOpen size={32} className="stroke-1 text-slate-300" />
                  <p className="text-xs text-slate-500 font-medium">
                    {recipes.length === 0 ? 'レシピがまだ登録されていません。' : '合致するレシピがありません。'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold transition-all bg-white"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="献立の削除"
        message="この献立を削除しますか？"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        isDestructive={true}
        onConfirm={executeDeleteMeal}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setMealPlanIdToDelete(null);
        }}
      />
    </div>
  );
}
