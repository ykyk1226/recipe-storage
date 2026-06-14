'use client';

import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import RecipeForm from './RecipeForm';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface AIImportViewProps {
  categories: Category[];
  onSubmitParsedRecipe: (data: any) => void;
  onCancel: () => void;
}

export default function AIImportView({
  categories,
  onSubmitParsedRecipe,
  onCancel,
}: AIImportViewProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<any | null>(null);

  const handleParse = async () => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '解析中にエラーが発生しました');
      }

      // Format parsed structure to match RecipeForm expected shape
      const formattedRecipe = {
        title: data.title || '',
        description: data.description || '',
        servings: data.servings || 2,
        prepTime: data.prepTime !== undefined ? data.prepTime : null,
        cookTime: data.cookTime !== undefined ? data.cookTime : null,
        image: '',
        sourceUrl: '',
        categories: [],
        ingredients: data.ingredients?.map((ing: any) => ({
          name: ing.name || '',
          amount: String(ing.amount || ''),
          unit: ing.unit || '',
        })) || [],
        steps: data.steps?.map((st: any) => ({
          stepNumber: st.stepNumber,
          instruction: st.instruction || '',
          image: null,
        })) || [],
      };

      setParsedRecipe(formattedRecipe);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'レシピの自動解析に失敗しました。APIキーの設定や入力テキストを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParsedRecipe(null);
    setError(null);
  };

  // Render preview edit form if parsed successfully
  if (parsedRecipe) {
    return (
      <div className="space-y-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 pt-4">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>コピペ入力画面に戻る</span>
          </button>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            <Sparkles size={12} />
            <span>AI解析完了：内容を調整して保存してください</span>
          </div>
        </div>

        <RecipeForm
          categories={categories}
          initialData={parsedRecipe}
          onSubmit={onSubmitParsedRecipe}
          onCancel={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 select-none animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
          <Sparkles size={22} className="text-indigo-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">AIレシピ自動インポート</h2>
          <p className="text-xs text-slate-500">
            ブログ、メモ、SNSなどのテキストをコピペするだけで、AIが材料や作り方を抽出しレシピを作成します。
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* Input Text Area */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 flex items-center space-x-1.5">
          <FileText size={16} className="text-slate-400" />
          <span>レシピテキスト</span>
        </label>
        <textarea
          rows={12}
          value={text}
          disabled={loading}
          onChange={(e) => setText(e.target.value)}
          placeholder="【入力例】&#10;肉じゃがの作り方&#10;&#10;材料（2人前）&#10;・豚バラ肉：200g&#10;・じゃがいも：3個&#10;・にんじん：1本&#10;&#10;手順&#10;1. じゃがいもとにんじんを切る。&#10;2. 鍋で肉を炒めたあと、野菜を加えて煮汁で煮る..."
          className="w-full text-sm px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={loading}
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          キャンセル
        </button>

        <button
          type="button"
          disabled={loading || text.trim() === ''}
          onClick={handleParse}
          className="px-5 py-2 bg-accent-purple hover:bg-accent-purple-hover disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin text-white" size={16} />
              <span>AI解析中...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} className="text-white" />
              <span>AIで材料・手順を解析する</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
