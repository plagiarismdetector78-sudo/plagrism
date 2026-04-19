import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

function QuestionBankPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userId, setUserId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [editCategory, setEditCategory] = useState(null);

  const [questionModal, setQuestionModal] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    category: '',
    difficultyLevel: 'Medium',
    expectedAnswer: '',
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    setUserId(localStorage.getItem('userId'));
  }, []);

  const fetchCategories = useCallback(async () => {
    const uid = localStorage.getItem('userId');
    if (!uid) return;
    setLoadingCategories(true);
    try {
      const res = await fetch(`/api/interviewer/categories?userId=${encodeURIComponent(uid)}`);
      const data = await res.json();
      if (data.success) setCategories(data.categories || []);
    } catch (e) {
      console.error(e);
      alert('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    const uid = localStorage.getItem('userId');
    if (!uid) return;
    setLoadingQuestions(true);
    try {
      let url = `/api/interviewer/questions?userId=${encodeURIComponent(uid)}`;
      if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setQuestions(data.questions || []);
    } catch (e) {
      console.error(e);
      alert('Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    if (!userId) return;
    fetchCategories();
  }, [userId, fetchCategories]);

  useEffect(() => {
    if (!userId) return;
    fetchQuestions();
  }, [userId, fetchQuestions]);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setSavingCategory(true);
    try {
      const res = await fetch('/api/interviewer/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Could not add category');
        return;
      }
      setNewCategoryName('');
      await fetchCategories();
    } catch (e) {
      alert('Network error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSaveEditCategory = async () => {
    if (!editCategory) return;
    const name = editCategory.name.trim();
    if (!name) return;
    try {
      const res = await fetch('/api/interviewer/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, id: editCategory.id, name }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Could not update category');
        return;
      }
      setEditCategory(null);
      await fetchCategories();
      await fetchQuestions();
    } catch (e) {
      alert('Network error');
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"? This only works if no questions use it.`)) return;
    try {
      const res = await fetch(
        `/api/interviewer/categories?id=${cat.id}&userId=${encodeURIComponent(userId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Could not delete');
        return;
      }
      await fetchCategories();
      if (filterCategory === cat.name) setFilterCategory('');
      await fetchQuestions();
    } catch (e) {
      alert('Network error');
    }
  };

  const openNewQuestion = () => {
    setQuestionForm({
      questionText: '',
      category: filterCategory || categories[0]?.name || '',
      difficultyLevel: 'Medium',
      expectedAnswer: '',
    });
    setQuestionModal({ mode: 'create' });
  };

  const openEditQuestion = (q) => {
    setQuestionForm({
      questionText: q.questiontext || '',
      category: q.category || '',
      difficultyLevel: q.difficultylevel || 'Medium',
      expectedAnswer: q.expected_answer || '',
    });
    setQuestionModal({ mode: 'edit', id: q.id });
  };

  const saveQuestion = async () => {
    if (!userId) return;
    const { questionText, category, difficultyLevel, expectedAnswer } = questionForm;
    if (!questionText.trim() || !category.trim() || !expectedAnswer.trim()) {
      alert('Question text, category, and expected answer are required.');
      return;
    }
    setSavingQuestion(true);
    try {
      if (questionModal.mode === 'create') {
        const res = await fetch('/api/interviewer/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            questionText: questionText.trim(),
            category: category.trim(),
            difficultyLevel,
            expectedAnswer: expectedAnswer.trim(),
          }),
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.message || 'Could not create question');
          return;
        }
      } else {
        const res = await fetch(`/api/interviewer/questions/${questionModal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            questionText: questionText.trim(),
            category: category.trim(),
            difficultyLevel,
            expectedAnswer: expectedAnswer.trim(),
          }),
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.message || 'Could not update question');
          return;
        }
      }
      setQuestionModal(null);
      await fetchCategories();
      await fetchQuestions();
    } catch (e) {
      alert('Network error');
    } finally {
      setSavingQuestion(false);
    }
  };

  const deleteQuestion = async (q) => {
    if (!confirm(`Delete this question (#${q.id})?`)) return;
    try {
      const res = await fetch(
        `/api/interviewer/questions/${q.id}?userId=${encodeURIComponent(userId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Could not delete');
        return;
      }
      await fetchQuestions();
    } catch (e) {
      alert('Network error');
    }
  };

  return (
    <>
      <Head>
        <title>Question Bank - Skill Scanner</title>
        <meta name="description" content="Manage interview questions, categories, and expected answers" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Navbar />
        <div className="flex">
          <Sidebar
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            handleLogout={handleLogout}
          />

          <div
            className={`flex-1 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-20' : 'ml-0 md:ml-72'
            } p-4 md:p-6`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Interview{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
                    Question Bank
                  </span>
                </h1>
                <p className="text-gray-300 text-sm md:text-base max-w-2xl">
                  Add and edit categories, questions, and expected answers. This data is stored in your
                  database and is used during live interviews and scoring.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Categories</h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={savingCategory || !newCategoryName.trim()}
                    className="px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50"
                  >
                    {savingCategory ? 'Saving…' : 'Add'}
                  </button>
                </div>
                {loadingCategories ? (
                  <div className="flex items-center text-gray-400 py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mr-2" />
                    Loading…
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-gray-400 text-sm">No categories yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-y-auto">
                    {categories.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10"
                      >
                        <span className="text-white text-sm font-medium truncate">{c.name}</span>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditCategory({ ...c })}
                            className="text-xs px-2 py-1 rounded-lg bg-white/10 text-purple-200 hover:bg-white/20"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c)}
                            className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">Tips</h2>
                <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
                  <li>Expected answers power similarity scoring during interviews.</li>
                  <li>Renaming a category updates every question in that category.</li>
                  <li>You cannot delete a category while questions still reference it.</li>
                  <li>New categories used on a question are added to the list automatically.</li>
                </ul>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Questions</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-gray-400 text-sm">Filter by category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm"
                    >
                      <option value="">All</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={fetchQuestions}
                      className="text-sm px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openNewQuestion}
                  className="px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500"
                >
                  + Add question
                </button>
              </div>

              {loadingQuestions ? (
                <div className="flex items-center text-gray-400 py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-3" />
                  Loading questions…
                </div>
              ) : questions.length === 0 ? (
                <p className="text-gray-400 py-8 text-center">No questions match this filter.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400">
                        <th className="py-2 pr-2">#</th>
                        <th className="py-2 pr-2">Question</th>
                        <th className="py-2 pr-2">Category</th>
                        <th className="py-2 pr-2">Difficulty</th>
                        <th className="py-2 pr-2 w-40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q) => (
                        <tr key={q.id} className="border-b border-white/5 align-top">
                          <td className="py-3 pr-2 text-white">{q.id}</td>
                          <td className="py-3 pr-2 max-w-md">
                            <p className="text-white line-clamp-3">{q.questiontext}</p>
                            {q.expected_answer && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                Expected: {q.expected_answer}
                              </p>
                            )}
                          </td>
                          <td className="py-3 pr-2 whitespace-nowrap">{q.category}</td>
                          <td className="py-3 pr-2 whitespace-nowrap">{q.difficultylevel}</td>
                          <td className="py-3 pr-2">
                            <button
                              type="button"
                              onClick={() => openEditQuestion(q)}
                              className="text-purple-300 hover:text-white mr-3"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteQuestion(q)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {editCategory && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Edit category</h3>
              <input
                type="text"
                value={editCategory.name}
                onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCategory(null)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditCategory}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {questionModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-4">
                {questionModal.mode === 'create' ? 'New question' : `Edit question #${questionModal.id}`}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Question text</label>
                  <textarea
                    rows={4}
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <input
                      type="text"
                      list="question-bank-categories"
                      value={questionForm.category}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, category: e.target.value })
                      }
                      placeholder="Pick existing or type a new name"
                      className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white"
                    />
                    <datalist id="question-bank-categories">
                      {categories.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                    <select
                      value={questionForm.difficultyLevel}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, difficultyLevel: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white"
                    >
                      {DIFFICULTY_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Expected answer</label>
                  <textarea
                    rows={5}
                    value={questionForm.expectedAnswer}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, expectedAnswer: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setQuestionModal(null)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveQuestion}
                  disabled={savingQuestion}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-50"
                >
                  {savingQuestion ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default withAuth(QuestionBankPage, 'interviewer');
