'use client';

import React from 'react';
import { Heart, Clock, Users, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
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
}

interface RecipeCardProps {
  recipe: Recipe;
  onCardClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export default function RecipeCard({
  recipe,
  onCardClick,
  onToggleFavorite,
}: RecipeCardProps) {
  // Total time helper
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <div
      onClick={onCardClick}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer select-none transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col h-full group"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden shrink-0 border-b border-slate-100">
        {recipe.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 space-y-1">
            <ImageIcon size={32} className="stroke-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider">No Image</span>
          </div>
        )}

        {/* Favorite Icon */}
        <button
          onClick={onToggleFavorite}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full glass shadow-sm transition-all active:scale-90 ${
            recipe.isFavorite
              ? 'text-rose-500 hover:text-rose-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title={recipe.isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
        >
          <Heart size={16} className={recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''} />
        </button>

        {/* Source link badge */}
        {recipe.sourceUrl && (
          <div className="absolute bottom-2.5 left-2.5 p-1 rounded-full glass shadow-sm text-slate-500" title="参考サイトあり">
            <LinkIcon size={12} />
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {recipe.categories.map((cat) => (
              <span
                key={cat.id}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${cat.color}15`, // Add opacity
                  color: cat.color,
                }}
              >
                {cat.name}
              </span>
            ))}
          </div>

          <h3 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-primary-green transition-colors">
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Specs */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-t border-slate-50 pt-2 shrink-0">
          <div className="flex items-center space-x-1">
            <Clock size={13} />
            <span>{totalTime > 0 ? `${totalTime}分` : '時間未設定'}</span>
          </div>

          <div className="flex items-center space-x-1">
            <Users size={13} />
            <span>{recipe.servings}人前</span>
          </div>
        </div>
      </div>
    </div>
  );
}
