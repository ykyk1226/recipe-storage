'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface IngredientInput {
  id?: string; // Keep track of database IDs if editing
  name: string;
  amount: string;
  unit: string;
}

interface StepInput {
  id?: string;
  stepNumber: number;
  instruction: string;
  image: string | null;
}

interface RecipeFormData {
  title: string;
  description: string;
  servings: number;
  prepTime: number | null;
  cookTime: number | null;
  image: string;
  sourceUrl: string;
  categoryIds: string[];
  ingredients: IngredientInput[];
  steps: StepInput[];
}

interface RecipeFormProps {
  categories: Category[];
  initialData: any | null; // Can be full Recipe object when editing
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isDrawer?: boolean;
}

export default function RecipeForm({
  categories,
  initialData,
  onSubmit,
  onCancel,
  isDrawer = false,
}: RecipeFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(2);
  const [prepTime, setPrepTime] = useState<string>('');
  const [cookTime, setCookTime] = useState<string>('');
  const [image, setImage] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  
  // Dynamic arrays
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: '', amount: '', unit: '' }
  ]);
  const [steps, setSteps] = useState<StepInput[]>([
    { stepNumber: 1, instruction: '', image: null }
  ]);

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setServings(initialData.servings || 2);
      setPrepTime(initialData.prepTime !== null ? String(initialData.prepTime) : '');
      setCookTime(initialData.cookTime !== null ? String(initialData.cookTime) : '');
      setImage(initialData.image || '');
      setSourceUrl(initialData.sourceUrl || '');
      setSelectedCategoryIds(initialData.categories?.map((c: any) => c.id) || []);
      
      if (initialData.ingredients && initialData.ingredients.length > 0) {
        setIngredients(
          initialData.ingredients.map((ing: any) => ({
            id: ing.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          }))
        );
      } else {
        setIngredients([{ name: '', amount: '', unit: '' }]);
      }
      
      if (initialData.steps && initialData.steps.length > 0) {
        setSteps(
          initialData.steps.map((st: any) => ({
            id: st.id,
            stepNumber: st.stepNumber,
            instruction: st.instruction,
            image: st.image,
          }))
        );
      } else {
        setSteps([{ stepNumber: 1, instruction: '', image: null }]);
      }
    }
  }, [initialData]);

  // Categories helper
  const handleToggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Ingredients helpers
  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof IngredientInput, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  // Support Tab/Enter navigation in ingredients dynamic list
  const handleIngredientKeyDown = (e: React.KeyboardEvent, index: number, field: 'name' | 'amount' | 'unit') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'unit' && index === ingredients.length - 1) {
        // At the last field of the last ingredient, add a new row and focus
        handleAddIngredient();
      }
    }
  };

  // Steps helpers
  const handleAddStep = () => {
    setSteps([...steps, { stepNumber: steps.length + 1, instruction: '', image: null }]);
  };

  const handleRemoveStep = (index: number) => {
    const filtered = steps.filter((_, i) => i !== index);
    // Re-index stepNumbers
    const reindexed = filtered.map((step, i) => ({
      ...step,
      stepNumber: i + 1,
    }));
    setSteps(reindexed);
  };

  const handleStepChange = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], instruction: value };
    setSteps(updated);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...steps];
    
    // Swap steps
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // Correct step numbers
    const corrected = updated.map((step, i) => ({
      ...step,
      stepNumber: i + 1,
    }));
    setSteps(corrected);
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty ingredients/steps
    const cleanIngredients = ingredients.filter((ing) => ing.name.trim() !== '');
    const cleanSteps = steps.filter((st) => st.instruction.trim() !== '');

    const formData = {
      title: title.trim(),
      description: description.trim() || null,
      servings: Number(servings),
      prepTime: prepTime.trim() !== '' ? Number(prepTime) : null,
      cookTime: cookTime.trim() !== '' ? Number(cookTime) : null,
      image: image.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      categoryIds: selectedCategoryIds,
      ingredients: cleanIngredients,
      steps: cleanSteps,
    };

    onSubmit(formData);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`space-y-6 select-none ${
        isDrawer 
          ? 'w-full p-2' 
          : 'max-w-4xl mx-auto p-6 bg-white border border-slate-200 rounded-2xl shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800">
          {initialData ? 'レシピを編集する' : '新しいレシピを追加'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className={isDrawer ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
        {/* Left Column - General Info */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">レシピ名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="料理名を入力 (例: カレーライス)"
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">レシピのメモ・説明</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="コツや特徴などがあれば記述"
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">人数分 <span className="text-red-500">*</span></label>
              <select
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-green bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num}>{num} 人前</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">下ごしらえ時間</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={0}
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="10"
                    className="w-full text-sm pl-4 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green"
                  />
                  <span className="absolute right-3 text-xs text-slate-400 font-bold">分</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">調理時間</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={0}
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    placeholder="20"
                    className="w-full text-sm pl-4 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green"
                  />
                  <span className="absolute right-3 text-xs text-slate-400 font-bold">分</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">レシピ画像URL</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/... (空欄も可)"
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">参考元のURL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://cookpad.com/... (空欄も可)"
              className="w-full text-sm px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green"
            />
          </div>

          {/* Categories select */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">カテゴリ選択</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'border-transparent text-white'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                    style={{
                      backgroundColor: isSelected ? cat.color : undefined,
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Ingredients Input */}
        <div className={`space-y-4 flex flex-col ${isDrawer ? 'h-[320px]' : 'h-[520px]'}`}>
          <div className="flex items-center justify-between shrink-0">
            <label className="text-sm font-bold text-slate-700">材料リスト <span className="text-red-500">*</span></label>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="text-xs font-bold text-primary-green hover:text-primary-green-hover flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>行を追加</span>
            </button>
          </div>

          {/* Ingredient rows scrollable container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 border border-slate-100 rounded-xl p-3 bg-slate-50/30">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  required
                  placeholder="材料名 (例: 豚肉)"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  onKeyDown={(e) => handleIngredientKeyDown(e, index, 'name')}
                  className="flex-1 min-w-0 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green bg-white"
                />
                <input
                  type="text"
                  placeholder="分量 (例: 200)"
                  value={ing.amount}
                  onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                  onKeyDown={(e) => handleIngredientKeyDown(e, index, 'amount')}
                  className="w-20 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green bg-white"
                />
                <input
                  type="text"
                  placeholder="単位 (例: g)"
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  onKeyDown={(e) => handleIngredientKeyDown(e, index, 'unit')}
                  className="w-16 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green bg-white"
                />
                <button
                  type="button"
                  disabled={ingredients.length <= 1}
                  onClick={() => handleRemoveIngredient(index)}
                  className="p-1.5 text-slate-300 hover:text-red-500 disabled:opacity-30 rounded-lg transition-colors shrink-0"
                  title="行削除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Bottom Full-Width - Instructions Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-700">作り方・手順</label>
          <button
            type="button"
            onClick={handleAddStep}
            className="text-xs font-bold text-primary-green hover:text-primary-green-hover flex items-center space-x-1"
          >
            <Plus size={14} />
            <span>ステップを追加</span>
          </button>
        </div>

        <div className="space-y-3 bg-slate-50/20 p-4 border border-slate-100 rounded-xl max-h-[300px] overflow-y-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-slate-200/80">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold text-xs shrink-0 mt-2">
                {step.stepNumber}
              </span>
              <textarea
                rows={2}
                required
                value={step.instruction}
                onChange={(e) => handleStepChange(index, e.target.value)}
                placeholder={`ステップ ${step.stepNumber} の作り方を記入...`}
                className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green resize-none"
              />
              <div className="flex flex-col space-y-1 mt-1 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveStep(index, 'up')}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors"
                  title="上に移動"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={index === steps.length - 1}
                  onClick={() => handleMoveStep(index, 'down')}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors"
                  title="下に移動"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <button
                type="button"
                disabled={steps.length <= 1}
                onClick={() => handleRemoveStep(index)}
                className="p-1.5 text-slate-300 hover:text-red-500 disabled:opacity-30 rounded-lg transition-colors mt-2 shrink-0"
                title="ステップ削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-primary-green hover:bg-primary-green-hover text-white rounded-xl text-sm font-semibold shadow-sm flex items-center space-x-1.5 transition-all"
        >
          <Save size={16} />
          <span>レシピを保存</span>
        </button>
      </div>
    </form>
  );
}
