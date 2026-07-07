'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../providers';
import { formatCurrency, formatDate, getProjectStatusLabel, getOfferStatusLabel } from '@bauimperium/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function DashboardContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'offers' | 'invoices' | 'settings'>('overview');
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voiceInput, setVoiceInput] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, projectsRes, offersRes, invoicesRes] = await Promise.all([
        fetch(`${API_URL}/craftsmen/me/profile`, { headers }),
        fetch(`${API_URL}/projects?isPremium=true`, { headers }),
        fetch(`${API_URL}/offers`, { headers }),
        fetch(`${API_URL}/invoices`, { headers }),
      ]);

      if (profileRes.ok) {
        const { data } = await profileRes.json();
        setProfile(data);
      }
      if (projectsRes.ok) {
        const { data } = await projectsRes.json();
        setProjects(data);
      }
      if (offersRes.ok) {
        const { data } = await offersRes.json();
        setOffers(data);
      }
      if (invoicesRes.ok) {
        const { data } = await invoicesRes.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceOffer = async () => {
    if (!voiceInput.trim()) return;
    // AI voice-to-offer: in production, call AI core
    alert(`Spracheingabe empfangen: "${voiceInput}". KI generiert nun ein Angebot...`);
    setVoiceInput('');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    { label: 'Aktive Projekte', value: projects.length, icon: '🔨', color: 'from-green-500 to-emerald-600' },
    { label: 'Offene Angebote', value: offers.filter((o: any) => o.status === 'DRAFT' || o.status === 'SENT').length, icon: '📄', color: 'from-blue-500 to-blue-600' },
    { label: 'Ausstehende Zahlungen', value: invoices.filter((i: any) => i.status === 'SENT' || i.status === 'OVERDUE').length, icon: '💰', color: 'from-amber-500 to-orange-600' },
    { label: 'Bewertung', value: profile?.averageRating ? `${profile.averageRating}/5` : '–', icon: '⭐', color: 'from-purple-500 to-purple-600' },
  ];

  const openOffers = invoices.filter((i: any) => i.status === 'SENT' || i.status === 'OVERDUE');
  const totalOpenAmount = openOffers.reduce((sum: number, i: any) => sum + parseFloat(i.grossAmount), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="font-bold dark:text-white">Bauimperium</span>
                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full font-medium">
                  {profile?.isPremium ? 'PREMIUM' : 'FREE'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('settings')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold dark:text-white">{profile?.companyName || `${user.firstName} ${user.lastName}`}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-6 -mb-px">
            {[
              { id: 'overview', label: 'Übersicht', icon: '📊' },
              { id: 'projects', label: 'Projekte', icon: '🔨' },
              { id: 'offers', label: 'Angebote', icon: '📄' },
              { id: 'invoices', label: 'Rechnungen', icon: '💰' },
              { id: 'settings', label: 'Einstellungen', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-1 border-b-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Voice Input */}
              <div className="saas-card p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  🎤 Angebot per Sprache
                </h3>
                <textarea
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  className="input-field min-h-[80px] mb-3"
                  placeholder='"Für Badsanierung in München: 25m² Fliesen legen, 3 Heizkörper tauschen, Duschkabine installieren..."'
                />
                <button onClick={handleVoiceOffer} disabled={!voiceInput.trim()} className="btn-primary w-full text-sm">
                  🤖 KI-Angebot generieren
                </button>
              </div>

              {/* Recent Projects */}
              <div className="saas-card p-6">
                <h3 className="font-semibold mb-3">🔨 Offene Projekte</h3>
                {projects.length === 0 ? (
                  <p className="text-sm text-gray-500">Keine Projekte gefunden</p>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 3).map((p: any) => (
                      <div key={p.id} className="text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                        <p className="font-medium truncate">{p.title}</p>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{p.category?.nameDe || 'Allgemein'}</span>
                          {p.budgetMin && <span>{formatCurrency(p.budgetMin)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="#" className="text-sm text-green-600 hover:underline mt-3 inline-block">
                  Alle Projekte anzeigen →
                </Link>
              </div>

              {/* Financial Overview */}
              <div className="saas-card p-6">
                <h3 className="font-semibold mb-3">💰 Finanz-Übersicht</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Offene Rechnungen</span>
                    <span className="text-sm font-semibold text-amber-600">{openOffers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Offener Betrag</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(totalOpenAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Bereits bezahlt (diesen Monat)</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(invoices.filter((i: any) => i.status === 'PAID').reduce((sum: number, i: any) => sum + parseFloat(i.grossAmount), 0))}
                    </span>
                  </div>
                </div>
                <Link href="#" className="text-sm text-green-600 hover:underline mt-3 inline-block">
                  Detaillierte Aufstellung →
                </Link>
              </div>
            </div>

            {/* Available Projects Feed */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold dark:text-white">Verfügbare Projekte in Ihrer Region</h2>
                <Link href="/dashboard/projects" className="text-sm text-green-600 hover:underline">Alle anzeigen</Link>
              </div>

              {projects.length === 0 ? (
                <div className="saas-card p-12 text-center">
                  <div className="text-4xl mb-4">🏗️</div>
                  <p className="font-semibold mb-2">Noch keine passenden Projekte</p>
                  <p className="text-sm text-gray-500 mb-4">Wir benachrichtigen Sie, sobald ein neues Projekt in Ihrer Region eingestellt wird.</p>
                  <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Aktiv nach Projekten suchend...
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {projects.slice(0, 4).map((project: any) => (
                    <div key={project.id} className="saas-card p-5 hover:shadow-md hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm">{project.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          project.isUrgent ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
                        }`}>
                          {project.isUrgent ? '🔥 Eilt' : 'Standard'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{project.category?.nameDe || 'Allgemein'}</span>
                        {project.budgetMin && <span className="font-semibold">{formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax || project.budgetMin)}</span>}
                      </div>
                      <button className="mt-3 w-full py-2 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                        Angebot erstellen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* === OFFERS TAB === */}
        {activeTab === 'offers' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white">Meine Angebote</h2>
              <button className="btn-primary text-sm">+ Neues Angebot</button>
            </div>

            {offers.length === 0 ? (
              <div className="saas-card p-12 text-center">
                <div className="text-4xl mb-4">📄</div>
                <p className="font-semibold mb-2">Noch keine Angebote</p>
                <p className="text-sm text-gray-500">Erstellen Sie Ihr erstes Angebot per Sprache oder manuell.</p>
              </div>
            ) : (
              <div className="saas-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Nr.</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Projekt</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Betrag</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Datum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {offers.map((offer: any) => (
                      <tr key={offer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                        <td className="px-4 py-3 font-mono text-xs">{offer.offerNumber}</td>
                        <td className="px-4 py-3">{offer.project?.title || '–'}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(offer.grossAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/50' :
                            offer.status === 'SENT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50' :
                            offer.status === 'DRAFT' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700' :
                            offer.status === 'REJECTED' ? 'bg-red-100 text-red-600 dark:bg-red-900/50' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {getOfferStatusLabel(offer.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(offer.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* === INVOICES TAB === */}
        {activeTab === 'invoices' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white">Rechnungen (GoBD-konform)</h2>
              <button className="btn-primary text-sm">+ Neue Rechnung</button>
            </div>

            {invoices.length === 0 ? (
              <div className="saas-card p-12 text-center">
                <div className="text-4xl mb-4">🧾</div>
                <p className="font-semibold mb-2">Noch keine Rechnungen</p>
                <p className="text-sm text-gray-500">Erstellen Sie Ihre erste Rechnung aus einem Angebot oder manuell.</p>
              </div>
            ) : (
              <div className="saas-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Rechnungs-Nr.</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Kunde</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Betrag</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Fällig</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                        <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3">{inv.clientName}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(inv.grossAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            inv.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/50' :
                            inv.status === 'SENT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50' :
                            inv.status === 'OVERDUE' ? 'bg-red-100 text-red-600 dark:bg-red-900/50' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {inv.status === 'PAID' ? 'Bezahlt' :
                             inv.status === 'SENT' ? 'Gesendet' :
                             inv.status === 'OVERDUE' ? 'Überfällig' :
                             inv.status === 'DRAFT' ? 'Entwurf' : inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-6 dark:text-white">Profil-Einstellungen</h2>

            <div className="saas-card p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-2xl text-white font-bold">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{profile?.companyName || 'Ihr Unternehmen'}</h3>
                  <p className="text-sm text-gray-500">{profile?.description || 'Noch keine Beschreibung'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Firmenname</label>
                  <input className="input-field" value={profile?.companyName || ''} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mitarbeiter</label>
                  <input className="input-field" value={profile?.employeeCount || 0} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gründungsjahr</label>
                  <input className="input-field" value={profile?.foundedYear || '–'} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bonität</label>
                  <input className="input-field" value={profile?.creditRating || 'Ungeprüft'} readOnly />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-sm mb-3">Abo-Status: {profile?.subscription?.plan?.nameDe || 'Kostenlos'}</h4>
                {!profile?.isPremium && (
                  <button className="btn-primary text-sm">
                    ⬆ Jetzt upgraden – 14 Tage kostenlos testen
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Abmelden
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CraftsmanDashboardWrapper() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
