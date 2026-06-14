'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, CheckCircle2, Circle, Plus, RefreshCw, FolderPlus, X, Trash, Edit3, Check } from 'lucide-react';

interface ShoppingListObj {
  id: string;
  name: string;
  _count?: {
    items: number;
  };
}

interface ShoppingItem {
  id: string;
  name: string;
  amount: string | null;
  unit: string | null;
  isChecked: boolean;
  recipe?: {
    title: string;
  } | null;
}

interface ShoppingListProps {
  items: ShoppingItem[];
  lists: ShoppingListObj[];
  activeListId: string;
  onListChange: (id: string) => void;
  onAddList: (name: string) => void;
  onUpdateList: (id: string, name: string) => void;
  onDeleteList: (id: string) => void;
  onToggleItem: (id: string, isChecked: boolean) => void;
  onAddItem: (name: string, amount: string, unit: string) => void;
  onDeleteItem: (id: string) => void;
  onClearChecked: () => void;
  onClearAll: () => void;
  loading?: boolean;
}

export default function ShoppingList({
  items,
  lists,
  activeListId,
  onListChange,
  onAddList,
  onUpdateList,
  onDeleteList,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onClearChecked,
  onClearAll,
  loading = false,
}: ShoppingListProps) {
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [unitInput, setUnitInput] = useState('');

  // New list creation states
  const [showAddListForm, setShowAddListForm] = useState(false);
  const [newListName, setNewListName] = useState('');

  // List renaming states
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [editListName, setEditListName] = useState('');

  const activeList = lists.find((l) => l.id === activeListId);

  // Sync rename input when active list changes
  useEffect(() => {
    if (activeList) {
      setEditListName(activeList.name);
    }
    setIsEditingListName(false); // Close edit mode if active list changes
  }, [activeListId, activeList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (cleanName) {
      onAddItem(cleanName, amountInput.trim(), unitInput.trim());
      setNameInput('');
      setAmountInput('');
      setUnitInput('');
    }
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanListName = newListName.trim();
    if (cleanListName) {
      onAddList(cleanListName);
      setNewListName('');
      setShowAddListForm(false);
    }
  };

  const handleRenameListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editListName.trim();
    if (cleanName && activeList && cleanName !== activeList.name) {
      onUpdateList(activeListId, cleanName);
      setIsEditingListName(false);
    } else {
      setIsEditingListName(false);
    }
  };

  const checkedCount = items.filter((item) => item.isChecked).length;

  return (
    <aside className="w-80 border-l border-slate-200 bg-white flex flex-col h-screen overflow-y-auto shrink-0 select-none">
      {/* Header Info */}
      <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-800">
            <ShoppingCart size={18} className="text-primary-green" />
            <h2 className="text-base font-bold tracking-tight">お買い物リスト</h2>
          </div>
          <button
            onClick={() => setShowAddListForm(!showAddListForm)}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition-colors"
            title="新しいお買い物リストを作成"
          >
            {showAddListForm ? <X size={16} /> : <FolderPlus size={16} />}
          </button>
        </div>

        {/* Create new list form (dropdown slider) */}
        {showAddListForm && (
          <form onSubmit={handleCreateList} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-xl border border-slate-100/60 animate-in fade-in duration-200">
            <input
              type="text"
              required
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="リスト名... (例: BBQ用)"
              className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green bg-white"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-primary-green hover:bg-primary-green-hover text-white rounded-lg text-xs font-semibold shrink-0"
            >
              作成
            </button>
          </form>
        )}

        {/* List Name Renamer OR Dropdown Selector */}
        <div className="flex items-center space-x-1.5">
          {isEditingListName ? (
            <form onSubmit={handleRenameListSubmit} className="flex-1 flex items-center space-x-1 animate-in fade-in duration-200">
              <input
                type="text"
                required
                value={editListName}
                onChange={(e) => setEditListName(e.target.value)}
                className="flex-1 text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green bg-white"
                autoFocus
              />
              <button
                type="submit"
                className="p-1.5 bg-green-50 text-green-600 border border-green-100 rounded-lg hover:bg-green-100 transition-colors shrink-0"
                title="保存"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeList) setEditListName(activeList.name);
                  setIsEditingListName(false);
                }}
                className="p-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                title="キャンセル"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <>
              <select
                value={activeListId}
                onChange={(e) => onListChange(e.target.value)}
                className="flex-1 text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-primary-green cursor-pointer truncate"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l._count?.items ?? 0})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsEditingListName(true)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors shrink-0 border border-transparent hover:border-slate-100"
                title="リスト名を変更"
              >
                <Edit3 size={14} />
              </button>

              {lists.length > 1 && (
                <button
                  onClick={() => {
                    if (activeList && window.confirm(`お買い物リスト「${activeList.name}」を削除してもよろしいですか？（中身も削除されます）`)) {
                      onDeleteList(activeListId);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 border border-transparent hover:border-slate-100"
                  title="このリストを削除"
                >
                  <Trash size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Manual Add Item Form */}
      <div className="p-3 border-b border-slate-50 bg-slate-50/20 shrink-0">
        <form onSubmit={handleSubmit} className="space-y-1.5">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="買うものを追加... (例: 牛乳)"
            required
            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green bg-white"
          />
          <div className="flex space-x-2">
            <input
              type="text"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="数量 (例: 1)"
              className="w-20 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green bg-white"
            />
            <input
              type="text"
              value={unitInput}
              onChange={(e) => setUnitInput(e.target.value)}
              placeholder="単位 (例: 本)"
              className="flex-1 min-w-0 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-green bg-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-primary-green hover:bg-primary-green-hover text-white rounded-lg transition-all flex items-center justify-center shrink-0"
            >
              <Plus size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* Item List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 space-x-2">
            <RefreshCw className="animate-spin" size={16} />
            <span className="text-xs">更新中...</span>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start justify-between p-2.5 rounded-lg border transition-all ${
                  item.isChecked
                    ? 'bg-slate-50/60 border-slate-100 text-slate-400'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div
                  onClick={() => onToggleItem(item.id, !item.isChecked)}
                  className="flex items-start space-x-3 cursor-pointer flex-1 min-w-0"
                >
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 transition-transform active:scale-90"
                  >
                    {item.isChecked ? (
                      <CheckCircle2 size={16} className="text-slate-300 fill-slate-100" />
                    ) : (
                      <Circle size={16} className="text-slate-400" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0 leading-tight">
                    <span className={`text-xs font-semibold ${item.isChecked ? 'line-through' : ''}`}>
                      {item.name}
                    </span>
                    {(item.amount || item.unit) && (
                      <span className="text-xs text-slate-400 ml-1.5">
                        {item.amount || ''} {item.unit || ''}
                      </span>
                    )}
                    {item.recipe && (
                      <div className="text-[10px] text-slate-400 truncate mt-0.5" title={item.recipe.title}>
                        レシピ: {item.recipe.title}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
                <ShoppingCart size={28} className="stroke-1 text-slate-300" />
                <p className="text-[10px] italic">リストは空です</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Controls */}
      {items.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2 select-none shrink-0">
          <button
            onClick={onClearChecked}
            disabled={checkedCount === 0}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 text-[10px] font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all disabled:opacity-50"
          >
            <span>チェック済み削除</span>
          </button>
          <button
            onClick={onClearAll}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 transition-all"
          >
            <Trash2 size={10} />
            <span>すべてクリア</span>
          </button>
        </div>
      )}
    </aside>
  );
}
