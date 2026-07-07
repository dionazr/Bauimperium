'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'CLIENT' as 'CLIENT' | 'CRAFTSMAN',
    companyName: '',
    acceptTerms: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Bitte akzeptieren Sie die AGB');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        companyName: formData.role === 'CRAFTSMAN' ? formData.companyName : undefined,
      });
      router.push(formData.role === 'CRAFTSMAN' ? '/craftsman/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 p-4">
      <div className="w-full max-w-lg">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-2xl dark:text-white">
            Bau<span className="text-blue-600">imperium</span>
          </span>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-center mb-2">Konto erstellen</h2>
          <p className="text-sm text-gray-500 text-center mb-8">Starten Sie mit Ihrem Bauprojekt</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'CLIENT' }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.role === 'CLIENT'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🏠</div>
                <div className="text-sm font-semibold">Bauherr</div>
                <div className="text-xs text-gray-500">Ich suche Handwerker</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'CRAFTSMAN' }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.role === 'CRAFTSMAN'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🔧</div>
                <div className="text-sm font-semibold">Handwerker</div>
                <div className="text-xs text-gray-500">Ich biete Leistungen</div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vorname</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nachname</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} className="input-field" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-Mail</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefon (optional)</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+49 171 1234567" />
            </div>

            {formData.role === 'CRAFTSMAN' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Firmenname</label>
                <input name="companyName" value={formData.companyName} onChange={handleChange} className="input-field" required />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Passwort</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Passwort bestätigen</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field" required minLength={8} />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="mt-1" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Ich akzeptiere die{' '}
                <Link href="#" className="text-blue-600 hover:underline">AGB</Link>
                {' '}und die{' '}
                <Link href="#" className="text-blue-600 hover:underline">Datenschutzerklärung</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Konto wird erstellt...' : 'Kostenlos registrieren'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Bereits registriert?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
