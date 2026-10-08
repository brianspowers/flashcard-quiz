import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  X, 
  Layers, 
  ListPlus, 
  Sparkles, 
  BookOpen, 
  Volume2 
} from 'lucide-react';
import type { WordSet, WordList, WordItem } from '../types';
import { exportData, importData, resetToDefaults } from '../utils/storage';
import { speakWord } from '../utils/audio';

interface AdminPanelProps {
  sets: WordSet[];
  onUpdateSets: (updatedSets: WordSet[]) => void;
  onDataReset: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  sets,
  onUpdateSets,
  onDataReset,
}) => {
  // Navigation within Admin
  const [selectedSetId, setSelectedSetId] = useState<string>(sets[0]?.id || '');
  const selectedSet = sets.find((s) => s.id === selectedSetId) || sets[0];

  const [selectedListId, setSelectedListId] = useState<string>(
    selectedSet?.lists[0]?.id || ''
  );
  const selectedList = selectedSet?.lists.find((l) => l.id === selectedListId) || selectedSet?.lists[0];

  // Modals / forms states
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDesc, setNewSetDesc] = useState('');
  const [newSetIcon, setNewSetIcon] = useState('📚');

  const [isEditingSet, setIsEditingSet] = useState(false);
  const [editSetName, setEditSetName] = useState('');
  const [editSetDesc, setEditSetDesc] = useState('');
  const [editSetIcon, setEditSetIcon] = useState('📚');

  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  const [isEditingList, setIsEditingList] = useState(false);
  const [editListName, setEditListName] = useState('');
  const [editListDesc, setEditListDesc] = useState('');

  // Word addition
  const [newSingleWord, setNewSingleWord] = useState('');
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkWordsInput, setBulkWordsInput] = useState('');
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editingWordText, setEditingWordText] = useState('');

  // Backup status
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 1. SET ACTIONS
  const handleCreateSet = () => {
    if (!newSetName.trim()) return;
    const newSet: WordSet = {
      id: 'set-' + Date.now(),
      name: newSetName.trim(),
      description: newSetDesc.trim() || undefined,
      icon: newSetIcon || '📚',
      lists: [
        {
          id: 'list-' + Date.now(),
          name: 'List 1',
          words: [],
        },
      ],
    };
    const nextSets = [...sets, newSet];
    onUpdateSets(nextSets);
    setSelectedSetId(newSet.id);
    setSelectedListId(newSet.lists[0].id);
    setIsCreatingSet(false);
    setNewSetName('');
    setNewSetDesc('');
    showStatus(`Created set "${newSet.name}"`);
  };

  const handleStartEditSet = () => {
    if (!selectedSet) return;
    setEditSetName(selectedSet.name);
    setEditSetDesc(selectedSet.description || '');
    setEditSetIcon(selectedSet.icon || '📚');
    setIsEditingSet(true);
  };

  const handleSaveEditSet = () => {
    if (!selectedSet || !editSetName.trim()) return;
    const nextSets = sets.map((s) =>
      s.id === selectedSet.id
        ? {
            ...s,
            name: editSetName.trim(),
            description: editSetDesc.trim() || undefined,
            icon: editSetIcon,
          }
        : s
    );
    onUpdateSets(nextSets);
    setIsEditingSet(false);
    showStatus('Set details updated');
  };

  const handleDeleteSet = (setId: string) => {
    if (sets.length <= 1) {
      alert('You must have at least one set in your library.');
      return;
    }
    const target = sets.find((s) => s.id === setId);
    if (!confirm(`Are you sure you want to delete set "${target?.name}" and all its lists?`)) return;

    const nextSets = sets.filter((s) => s.id !== setId);
    onUpdateSets(nextSets);
    setSelectedSetId(nextSets[0]?.id || '');
    setSelectedListId(nextSets[0]?.lists[0]?.id || '');
    showStatus(`Deleted set "${target?.name}"`);
  };

  // 2. LIST ACTIONS
  const handleCreateList = () => {
    if (!selectedSet || !newListName.trim()) return;
    const newList: WordList = {
      id: 'list-' + Date.now(),
      name: newListName.trim(),
      description: newListDesc.trim() || undefined,
      words: [],
    };

    const nextSets = sets.map((s) =>
      s.id === selectedSet.id
        ? { ...s, lists: [...s.lists, newList] }
        : s
    );

    onUpdateSets(nextSets);
    setSelectedListId(newList.id);
    setIsCreatingList(false);
    setNewListName('');
    setNewListDesc('');
    showStatus(`Added list "${newList.name}" to ${selectedSet.name}`);
  };

  const handleStartEditList = () => {
    if (!selectedList) return;
    setEditListName(selectedList.name);
    setEditListDesc(selectedList.description || '');
    setIsEditingList(true);
  };

  const handleSaveEditList = () => {
    if (!selectedSet || !selectedList || !editListName.trim()) return;
    const nextSets = sets.map((s) => {
      if (s.id !== selectedSet.id) return s;
      return {
        ...s,
        lists: s.lists.map((l) =>
          l.id === selectedList.id
            ? { ...l, name: editListName.trim(), description: editListDesc.trim() || undefined }
            : l
        ),
      };
    });
    onUpdateSets(nextSets);
    setIsEditingList(false);
    showStatus('List details updated');
  };

  const handleDeleteList = (listId: string) => {
    if (!selectedSet) return;
    if (selectedSet.lists.length <= 1) {
      alert('A set must have at least one list.');
      return;
    }
    const target = selectedSet.lists.find((l) => l.id === listId);
    if (!confirm(`Are you sure you want to delete list "${target?.name}"?`)) return;

    const nextLists = selectedSet.lists.filter((l) => l.id !== listId);
    const nextSets = sets.map((s) =>
      s.id === selectedSet.id ? { ...s, lists: nextLists } : s
    );
    onUpdateSets(nextSets);
    setSelectedListId(nextLists[0]?.id || '');
    showStatus(`Deleted list "${target?.name}"`);
  };

  // 3. WORD ACTIONS
  const handleAddSingleWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSet || !selectedList || !newSingleWord.trim()) return;

    const cleanWord = newSingleWord.trim();
    if (selectedList.words.some((w) => w.word.toLowerCase() === cleanWord.toLowerCase())) {
      alert(`"${cleanWord}" is already in this list.`);
      return;
    }

    const newWordItem: WordItem = {
      id: 'w-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      word: cleanWord,
    };

    const nextSets = sets.map((s) => {
      if (s.id !== selectedSet.id) return s;
      return {
        ...s,
        lists: s.lists.map((l) =>
          l.id === selectedList.id
            ? { ...l, words: [...l.words, newWordItem] }
            : l
        ),
      };
    });

    onUpdateSets(nextSets);
    setNewSingleWord('');
    showStatus(`Added "${cleanWord}"`);
  };

  const handleBulkAddWords = () => {
    if (!selectedSet || !selectedList || !bulkWordsInput.trim()) return;

    const tokens = bulkWordsInput
      .split(/[\n,;]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (tokens.length === 0) return;

    const existing = new Set(selectedList.words.map((w) => w.word.toLowerCase()));
    const newItems: WordItem[] = [];

    tokens.forEach((raw) => {
      const lower = raw.toLowerCase();
      if (!existing.has(lower)) {
        existing.add(lower);
        newItems.push({
          id: 'w-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          word: raw,
        });
      }
    });

    if (newItems.length === 0) {
      alert('All provided words already exist in this list.');
      return;
    }

    const nextSets = sets.map((s) => {
      if (s.id !== selectedSet.id) return s;
      return {
        ...s,
        lists: s.lists.map((l) =>
          l.id === selectedList.id
            ? { ...l, words: [...l.words, ...newItems] }
            : l
        ),
      };
    });

    onUpdateSets(nextSets);
    setBulkWordsInput('');
    setIsBulkAdding(false);
    showStatus(`Added ${newItems.length} words to ${selectedList.name}!`);
  };

  const handleDeleteWord = (wordId: string) => {
    if (!selectedSet || !selectedList) return;
    const nextSets = sets.map((s) => {
      if (s.id !== selectedSet.id) return s;
      return {
        ...s,
        lists: s.lists.map((l) =>
          l.id === selectedList.id
            ? { ...l, words: l.words.filter((w) => w.id !== wordId) }
            : l
        ),
      };
    });
    onUpdateSets(nextSets);
  };

  const handleSaveEditWord = (wordId: string) => {
    if (!selectedSet || !selectedList || !editingWordText.trim()) return;
    const clean = editingWordText.trim();

    const nextSets = sets.map((s) => {
      if (s.id !== selectedSet.id) return s;
      return {
        ...s,
        lists: s.lists.map((l) =>
          l.id === selectedList.id
            ? {
                ...l,
                words: l.words.map((w) =>
                  w.id === wordId ? { ...w, word: clean } : w
                ),
              }
            : l
        ),
      };
    });

    onUpdateSets(nextSets);
    setEditingWordId(null);
    setEditingWordText('');
  };

  // 4. BACKUP / RESTORE
  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wordquest-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Backup JSON downloaded successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importData(content);
      if (res.success) {
        showStatus('Backup imported successfully!');
        window.location.reload();
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset to factory default sight words? Custom changes and stats will be replaced with curated lists.')) {
      const restored = resetToDefaults();
      onUpdateSets(restored.sets);
      onDataReset();
      setSelectedSetId(restored.sets[0].id);
      setSelectedListId(restored.sets[0].lists[0].id);
      showStatus('Reset to default sight words successfully');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold animate-pop ${
            statusMessage.type === 'success'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-fun text-3xl sm:text-4xl font-extrabold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-emerald-500" />
            <span>Manage Sets & Lists</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Create or edit word collections, bulk add words, and export backups.
          </p>
        </div>

        {/* Global actions: Backup & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Download library and stats backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 bg-white border border-slate-200 hover:bg-orange-50 px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Restore sample sight words"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Set Selection & List Selection */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sets Section */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="font-fun text-lg font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Word Sets ({sets.length})</span>
              </span>
              <button
                onClick={() => setIsCreatingSet(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Set</span>
              </button>
            </div>

            {/* Set create form */}
            {isCreatingSet && (
              <div className="mb-4 p-4 bg-orange-50/70 border border-orange-200 rounded-2xl animate-pop">
                <h4 className="font-fun text-sm font-bold text-orange-900 mb-2">Create New Set</h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Icon (e.g. 📚, 🚀, 🐶)"
                      value={newSetIcon}
                      onChange={(e) => setNewSetIcon(e.target.value)}
                      className="w-16 p-2 rounded-xl border border-orange-200 bg-white text-center text-lg"
                    />
                    <input
                      type="text"
                      placeholder="Set Name (e.g. 1st Grade Dolch)"
                      value={newSetName}
                      onChange={(e) => setNewSetName(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-orange-200 bg-white text-xs font-bold"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Short description (optional)"
                    value={newSetDesc}
                    onChange={(e) => setNewSetDesc(e.target.value)}
                    className="w-full p-2 rounded-xl border border-orange-200 bg-white text-xs"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsCreatingSet(false)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSet}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
                    >
                      Save Set
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sets list */}
            <div className="space-y-2">
              {sets.map((set) => {
                const isSelected = set.id === selectedSet?.id;
                const totalWords = set.lists.reduce((acc, l) => acc + l.words.length, 0);

                return (
                  <div
                    key={set.id}
                    onClick={() => {
                      setSelectedSetId(set.id);
                      setSelectedListId(set.lists[0]?.id || '');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-50 border-orange-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{set.icon || '📚'}</span>
                      <div>
                        <div className="font-fun font-bold text-slate-800 text-sm">
                          {set.name}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {set.lists.length} lists • {totalWords} words
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditSet();
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                          title="Edit set"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSet(set.id);
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Delete set"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lists Section within Selected Set */}
          {selectedSet && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-fun text-lg font-bold text-slate-800 flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-emerald-500" />
                    <span>Lists in "{selectedSet.name}"</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsCreatingList(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New List</span>
                </button>
              </div>

              {/* List create form */}
              {isCreatingList && (
                <div className="mb-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl animate-pop">
                  <h4 className="font-fun text-sm font-bold text-emerald-900 mb-2">Add New List</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="List Name (e.g. Week 1, Animals, High Frequency)"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-full p-2 rounded-xl border border-emerald-200 bg-white text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Short description (optional)"
                      value={newListDesc}
                      onChange={(e) => setNewListDesc(e.target.value)}
                      className="w-full p-2 rounded-xl border border-emerald-200 bg-white text-xs"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setIsCreatingList(false)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateList}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        Save List
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lists items */}
              <div className="space-y-2">
                {selectedSet.lists.map((list) => {
                  const isSelected = list.id === selectedList?.id;
                  return (
                    <div
                      key={list.id}
                      onClick={() => setSelectedListId(list.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-fun font-bold text-slate-800 text-sm">
                          {list.name}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {list.words.length} words
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditList();
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            title="Edit list"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list.id);
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Delete list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Words in Selected List */}
        <div className="lg:col-span-7">
          {selectedList ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              {/* List Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                      {selectedSet.name} &gt;
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {selectedList.words.length} words
                    </span>
                  </div>
                  <h3 className="font-fun text-2xl font-bold text-slate-800">
                    {selectedList.name}
                  </h3>
                  {selectedList.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{selectedList.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBulkAdding(!isBulkAdding)}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isBulkAdding ? 'Close Bulk Add' : 'Bulk Paste Words'}</span>
                  </button>
                </div>
              </div>

              {/* Bulk Add Box */}
              {isBulkAdding && (
                <div className="mb-6 p-4 bg-purple-50/70 border border-purple-200 rounded-2xl animate-pop">
                  <h4 className="font-fun text-sm font-bold text-purple-900 mb-1">
                    Bulk Paste Words
                  </h4>
                  <p className="text-xs text-purple-700 mb-3">
                    Paste words separated by commas, spaces, or line breaks (e.g., from a spelling sheet or email).
                  </p>
                  <textarea
                    rows={4}
                    placeholder="cat, dog, bird, frog&#10;apple, banana, grape..."
                    value={bulkWordsInput}
                    onChange={(e) => setBulkWordsInput(e.target.value)}
                    className="w-full p-3 rounded-xl border border-purple-200 bg-white text-xs font-mono mb-3 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsBulkAdding(false)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkAddWords}
                      className="text-xs font-bold px-4 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 cursor-pointer shadow-xs"
                    >
                      Add Words Now
                    </button>
                  </div>
                </div>
              )}

              {/* Single Word Input */}
              <form onSubmit={handleAddSingleWord} className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Add a new word (press Enter)..."
                  value={newSingleWord}
                  onChange={(e) => setNewSingleWord(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!newSingleWord.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-fun font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Word</span>
                </button>
              </form>

              {/* Word List Display */}
              <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                {selectedList.words.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    No words in this list yet. Type a word above or use Bulk Paste to add words quickly!
                  </div>
                ) : (
                  selectedList.words.map((item, index) => {
                    const isEditing = editingWordId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-300 w-6 text-right">
                            {index + 1}.
                          </span>

                          {isEditing ? (
                            <input
                              type="text"
                              value={editingWordText}
                              onChange={(e) => setEditingWordText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditWord(item.id);
                                if (e.key === 'Escape') setEditingWordId(null);
                              }}
                              autoFocus
                              className="px-2 py-1 text-sm font-bold border border-amber-300 rounded-lg focus:outline-hidden"
                            />
                          ) : (
                            <span className="font-fun text-lg font-bold text-slate-800">
                              {item.word}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => speakWord(item.word)}
                            className="p-1.5 text-slate-400 hover:text-orange-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title={`Listen to "${item.word}"`}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>

                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEditWord(item.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingWordId(null)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingWordId(item.id);
                                setEditingWordText(item.word);
                              }}
                              className="p-1.5 text-slate-300 group-hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit spelling"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteWord(item.id)}
                            className="p-1.5 text-slate-300 group-hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove word"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-fun text-lg font-bold text-slate-700">Select or create a list</h4>
              <p className="text-xs text-slate-500">Choose a list on the left to add or edit its words.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Set Modal */}
      {isEditingSet && selectedSet && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-slate-200 animate-pop">
            <h4 className="font-fun text-xl font-bold text-slate-800 mb-4">Edit Word Set</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Set Icon</label>
                <input
                  type="text"
                  value={editSetIcon}
                  onChange={(e) => setEditSetIcon(e.target.value)}
                  className="w-16 p-2 rounded-xl border border-slate-200 text-center text-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Set Name</label>
                <input
                  type="text"
                  value={editSetName}
                  onChange={(e) => setEditSetName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Description</label>
                <input
                  type="text"
                  value={editSetDesc}
                  onChange={(e) => setEditSetDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsEditingSet(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditSet}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {isEditingList && selectedList && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-slate-200 animate-pop">
            <h4 className="font-fun text-xl font-bold text-slate-800 mb-4">Edit List</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">List Name</label>
                <input
                  type="text"
                  value={editListName}
                  onChange={(e) => setEditListName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Description</label>
                <input
                  type="text"
                  value={editListDesc}
                  onChange={(e) => setEditListDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsEditingList(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditList}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
