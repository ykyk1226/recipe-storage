'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Clock, Users, Link as LinkIcon, Plus, Edit, Trash2, ShoppingBag, CheckSquare, Square } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  id: string;
  stepNumber: number;
  instruction: string;
  image: string | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  servings: number;
  prepTime: number | null;
  cookTime: number | null;
  image: string | null;
  isFavorite: boolean;
  sourceUrl: string | null;
  categories: Category[];
  ingredients: Ingredient[];
  steps: Step[];
}

interface RecipeDetailDrawerProps {
  recipe: Recipe | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onAddIngredientsToShopping: (items: Array<{ name: string; amount: string; unit: string }>) => void;
}

export default function RecipeDetailDrawer({
  recipe,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddIngredientsToShopping,
}: RecipeDetailDrawerProps) {
  const [servingsScale, setServingsScale] = useState(2);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Reset scale and ingredient selection when recipe changes
  useEffect(() => {
    if (recipe) {
      setServingsScale(recipe.servings);
      setSelectedIngredients(recipe.ingredients.map((i) => i.id));
    }
  }, [recipe]);

  if (!recipe) return null;

  // Servings ratio multiplier
  const scaleRatio = servingsScale / recipe.servings;

  // Parses ingredient amount to fraction/decimal and scales it
  const formatScaledAmount = (amountStr: string) => {
    // Try to parse as float
    const num = parseFloat(amountStr);
    if (isNaN(num)) return amountStr; // If text like "少々", keep as is

    // Handle common fraction strings (e.g. "1/2")
    if (amountStr.includes('/')) {
      const parts = amountStr.split('/');
      if (parts.length === 2) {
        const numPart = parseFloat(parts[0]);
        const denPart = parseFloat(parts[1]);
        if (!isNaN(numPart) && !isNaN(denPart)) {
          const val = (numPart / denPart) * scaleRatio;
          return Number(val.toFixed(2)).toString(); // Remove trailing zeros
        }
      }
    }

    const scaled = num * scaleRatio;
    // Format to 2 decimal places max, clean ending zeros
    return Number(scaled.toFixed(2)).toString();
  };

  const handleToggleSelectIng = (id: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAllIng = () => {
    if (selectedIngredients.length === recipe.ingredients.length) {
      setSelectedIngredients([]);
    } else {
      setSelectedIngredients(recipe.ingredients.map((i) => i.id));
    }
  };

  const handleAddSelectedToShopping = () => {
    const itemsToAdd = recipe.ingredients
      .filter((ing) => selectedIngredients.includes(ing.id))
      .map((ing) => ({
        name: ing.name,
        amount: formatScaledAmount(ing.amount),
        unit: ing.unit,
      }));

    if (itemsToAdd.length > 0) {
      onAddIngredientsToShopping(itemsToAdd);
    }
  };

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <div className="w-[480px] border-l border-slate-200 bg-white h-screen flex flex-col shadow-2xl shrink-0 z-20 select-none animate-in slide-in-from-right duration-300">
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
        >
          <X size={20} />
        </button>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onToggleFavorite(recipe.id, !recipe.isFavorite)}
            className={`p-2 rounded-lg transition-all ${
              recipe.isFavorite
                ? 'text-rose-500 hover:bg-rose-50'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
            title="お気に入りトグル"
          >
            <Heart size={20} className={recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-slate-500 hover:text-primary-green hover:bg-slate-50 rounded-lg transition-all"
            title="編集"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-all"
            title="削除"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Image & Title Scrollable Area */}
      <div className="flex-1 overflow-y-auto">
        {recipe.image && (
          <div className="w-full aspect-video relative bg-slate-100 border-b border-slate-100 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Title and Specs */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {recipe.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${cat.color}15`,
                    color: cat.color,
                  }}
                >
                  {cat.name}
                </span>
              ))}
            </div>

            <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">
              {recipe.title}
            </h2>

            {recipe.description && (
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100/60">
                {recipe.description}
              </p>
            )}

            <div className="flex items-center space-x-6 text-sm text-slate-500 font-medium pt-2">
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-slate-400" />
                <span>全体で {totalTime > 0 ? `${totalTime}分` : '未設定'} (調理: {recipe.cookTime || 0}分 / 下準備: {recipe.prepTime || 0}分)</span>
              </div>
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-primary-green hover:underline"
                >
                  <LinkIcon size={14} />
                  <span>参考元サイト</span>
                </a>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Servings Scale Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <span>材料リスト</span>
                <span className="text-xs text-slate-400 font-normal">（人数に合わせて自動計算）</span>
              </h3>
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-slate-400" />
                <select
                  value={servingsScale}
                  onChange={(e) => setServingsScale(Number(e.target.value))}
                  className="text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-green"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} 人前
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ingredients checklist */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                <button
                  onClick={handleToggleAllIng}
                  className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {selectedIngredients.length === recipe.ingredients.length ? (
                    <>
                      <CheckSquare size={14} className="text-primary-green" />
                      <span>全解除</span>
                    </>
                  ) : (
                    <>
                      <Square size={14} />
                      <span>全選択</span>
                    </>
                  )}
                </button>
                <span className="text-xs font-medium text-slate-400">
                  選択中: {selectedIngredients.length} / {recipe.ingredients.length}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {recipe.ingredients.map((ing) => {
                  const isChecked = selectedIngredients.includes(ing.id);
                  return (
                    <div
                      key={ing.id}
                      onClick={() => handleToggleSelectIng(ing.id)}
                      className={`flex items-center justify-between p-3 text-sm cursor-pointer transition-all hover:bg-slate-50/50 ${
                        isChecked ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="shrink-0 transition-transform active:scale-95">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-primary-green fill-green-50" />
                          ) : (
                            <Square size={16} className="text-slate-300" />
                          )}
                        </span>
                        <span className={`font-medium truncate ${isChecked ? '' : 'line-through decoration-slate-200'}`}>
                          {ing.name}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-600 shrink-0 ml-4">
                        {formatScaledAmount(ing.amount)} {ing.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAddSelectedToShopping}
              disabled={selectedIngredients.length === 0}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary-green hover:bg-primary-green-hover disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 text-white font-semibold rounded-xl text-sm transition-all shadow-sm border border-transparent"
            >
              <ShoppingBag size={16} />
              <span>選択した材料をお買い物リストに追加</span>
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* Steps */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">作り方・手順</h3>
            <div className="space-y-4">
              {recipe.steps.map((step) => (
                <div key={step.id} className="flex space-x-4">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs shrink-0 mt-0.5">
                    {step.stepNumber}
                  </span>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {step.instruction}
                    </p>
                    {step.image && (
                      <div className="relative aspect-video w-full max-w-xs bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={step.image} alt={`ステップ ${step.stepNumber}`} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {recipe.steps.length === 0 && (
                <p className="text-xs text-slate-400 italic">手順が登録されていません</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="レシピの削除"
        message={recipe ? `「${recipe.title}」を削除してもよろしいですか？` : ''}
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        isDestructive={true}
        onConfirm={() => {
          if (recipe) {
            onDelete(recipe.id);
            setIsDeleteConfirmOpen(false);
          }
        }}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
}
