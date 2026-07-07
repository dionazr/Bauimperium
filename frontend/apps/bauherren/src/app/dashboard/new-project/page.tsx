'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { formatCurrency } from '@bauimperium/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Mock categories (in production, fetch from API)
const CATEGORIES = [
  { id: 'placeholder', nameDe: 'Badezimmer Renovierung' },
  { id: 'placeholder2', nameDe: 'Dachdeckerarbeiten' },
  { id: 'placeholder3', nameDe: 'Bodenbelagsarbeiten' },
  { id: 'placeholder4', nameDe: 'Malerarbeiten' },
  { id: 'placeholder5', nameDe: 'Elektroinstallationen' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    budgetMin: '',
    budgetMax: '',
    budgetType: 'FIXED',
    squareMeters: '',
    isUrgent: false,
    street: '',
    houseNumber: '',
    city: '',
    postalCode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAiAnalyze = async () => {
    if (!formData.description) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/ai/analyze/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          inputText: `${formData.title}. ${formData.description}`,
          inputType: 'TEXT',
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setAiAnalysisResult(data);
        if (data.estimatedCosts) {
          setFormData(prev => ({
            ...prev,
            budgetMin: data.estimatedCosts.min?.toString() || '',
            budgetMax: data.estimatedCosts.max?.toString() || '',
            squareMeters: data.specifications?.find((s: any) => s.key === 'area_sqm')?.value?.toString() || '',
          }));
        }
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');

      const projectData = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId || undefined,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        budgetType: formData.budgetType,
        squareMeters: formData.squareMeters ? parseFloat(formData.squareMeters) : undefined,
        isUrgent: formData.isUrgent,
        address: formData.city ? {
          street: formData.street,
          houseNumber: formData.houseNumber,
          city: formData.city,
          postalCode: formData.postalCode,
        } : undefined,
      };

      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(projectData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Fehler beim Erstellen');
      }

      const { data } = await res.json();
      router.push(`/dashboard/projects/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-semibold dark:text-white">Neues Projekt</h1>
            <p className="text-sm text-gray-500">Beschreiben Sie Ihr Bauvorhaben</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Project Details */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h2 className="font-semibold text-lg dark:text-white">Projekt-Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titel *</label>
              <input name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder="z.B. Badezimmer Komplettsanierung" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Beschreibung</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field min-h-[120px]"
                placeholder="Beschreiben Sie Ihr Projekt detailliert. Was soll gemacht werden? Welche Materialien? Besondere Wünsche?"
                rows={5}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">{formData.description.length} Zeichen</span>
                <button
                  type="button"
                  onClick={handleAiAnalyze}
                  disabled={!formData.description}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  🤖 KI-Analyse durchführen
                </button>
              </div>
            </div>

            {aiAnalysisResult && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">KI-Analyse</span>
                  <span className="text-xs text-blue-500">Konfidenz: {(aiAnalysisResult.confidence * 100).toFixed(0)}%</span>
                </div>
                {aiAnalysisResult.estimatedDuration && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Geschätzte Dauer: {aiAnalysisResult.estimatedDuration.min}-{aiAnalysisResult.estimatedDuration.max} {aiAnalysisResult.estimatedDuration.unit}
                  </p>
                )}
                {aiAnalysisResult.dinNormReferences && aiAnalysisResult.dinNormReferences.length > 0 && (
                  <p className="text-xs text-blue-500 mt-1">
                    Relevante DIN-Normen: {aiAnalysisResult.dinNormReferences.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kategorie (optional)</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="input-field">
                  <option value="">Bitte wählen</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nameDe}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fläche (m²)</label>
                <input type="number" name="squareMeters" value={formData.squareMeters} onChange={handleChange} className="input-field" placeholder="z.B. 25" />
              </div>
            </div>
          </section>

          {/* Budget */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h2 className="font-semibold text-lg dark:text-white">Budget & Zeitplan</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Budget-Typ</label>
              <select name="budgetType" value={formData.budgetType} onChange={handleChange} className="input-field">
                <option value="FIXED">Festpreis</option>
                <option value="ESTIMATE">Kostenschätzung</option>
                <option value="NEGOTIABLE">Verhandlungssache</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Budget von (€)</label>
                <input type="number" name="budgetMin" value={formData.budgetMin} onChange={handleChange} className="input-field" placeholder="z.B. 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Budget bis (€)</label>
                <input type="number" name="budgetMax" value={formData.budgetMax} onChange={handleChange} className="input-field" placeholder="z.B. 15000" />
              </div>
            </div>

            <label className="flex items-center gap-3">
              <input type="checkbox" name="isUrgent" checked={formData.isUrgent} onChange={handleChange} className="rounded" />
              <span className="text-sm dark:text-gray-300">Dieses Projekt ist eilig</span>
            </label>
          </section>

          {/* Location */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h2 className="font-semibold text-lg dark:text-white">Standort (optional)</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Straße & Hausnummer</label>
                <div className="grid grid-cols-4 gap-2">
                  <input name="street" value={formData.street} onChange={handleChange} className="input-field col-span-3" placeholder="Musterstraße" />
                  <input name="houseNumber" value={formData.houseNumber} onChange={handleChange} className="input-field" placeholder="Nr." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">PLZ</label>
                <input name="postalCode" value={formData.postalCode} onChange={handleChange} className="input-field" placeholder="80331" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stadt</label>
                <input name="city" value={formData.city} onChange={handleChange} className="input-field" placeholder="München" />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-4">
            <Link href="/dashboard" className="flex-1 text-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800">
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Wird erstellt...' : 'Projekt veröffentlichen'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
