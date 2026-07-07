'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';
import { formatCurrency, formatDate, getProjectStatusLabel, truncateText } from '@bauimperium/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface DashboardProject {
  id: string;
  title: string;
  status: string;
  budgetMin?: number;
  budgetMax?: number;
  createdAt: string;
  _count?: { applications: number; messages: number };
  category?: { nameDe: string };
  milestones?: Array<{ status: string; name: string; phaseNumber: number }>;
}

export default function ClientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/projects/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { data } = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeProjects = projects.filter(p => !['COMPLETED', 'CANCELLED', 'ARCHIVED'].includes(p.status));
  const completedProjects = projects.filter(p => ['COMPLETED'].includes(p.status));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="font-bold dark:text-white">Bauimperium</span>
              </Link>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">Mein Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold dark:text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Aktive Projekte', value: activeProjects.length, color: 'bg-blue-500', icon: '🏗️' },
            { label: 'Angebote erhalten', value: projects.reduce((sum, p) => sum + (p._count?.applications || 0), 0), color: 'bg-green-500', icon: '📄' },
            { label: 'Nachrichten', value: projects.reduce((sum, p) => sum + (p._count?.messages || 0), 0), color: 'bg-purple-500', icon: '💬' },
            { label: 'Abgeschlossen', value: completedProjects.length, color: 'bg-emerald-500', icon: '✅' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Link
            href="/dashboard/new-project"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neues Projekt
          </Link>
          <Link
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            Meine Handwerker
          </Link>
        </div>

        {/* Active Projects */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold dark:text-white">Aktive Projekte</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Noch keine Projekte</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Stellen Sie Ihr erstes Bauprojekt ein und erhalten Sie Angebote von geprüften Betrieben.</p>
              <Link
                href="/dashboard/new-project"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Projekt erstellen
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold dark:text-white group-hover:text-blue-600 transition-colors">
                          {truncateText(project.title, 50)}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                          project.status === 'IN_OFFER_PHASE' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                          project.status === 'IN_EXECUTION' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {getProjectStatusLabel(project.status)}
                        </span>
                      </div>
                      {project.category && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.category.nameDe}</p>
                      )}
                      <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
                        {project.budgetMin && <span>Budget: {formatCurrency(project.budgetMin)} - {formatCurrency(project.budgetMax || project.budgetMin)}</span>}
                        <span>Erstellt: {formatDate(project.createdAt)}</span>
                        {project._count && <span>Angebote: {project._count.applications}</span>}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Milestone Progress */}
        {activeProjects.some(p => p.milestones && p.milestones.length > 0) && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-6 dark:text-white">Projekt-Fortschritt</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              {activeProjects.filter(p => p.milestones && p.milestones.length > 0).slice(0, 3).map((project) => (
                <div key={project.id} className="mb-6 last:mb-0">
                  <h4 className="font-semibold text-sm mb-3 dark:text-white">{project.title}</h4>
                  <div className="space-y-3">
                    {project.milestones?.map((m) => (
                      <div key={m.phaseNumber} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          m.status === 'RELEASED' || m.status === 'APPROVED' ? 'bg-green-500' :
                          m.status === 'IN_PROGRESS' || m.status === 'VERIFIED' ? 'bg-blue-500' :
                          m.status === 'DISPUTED' ? 'bg-red-500' :
                          'bg-gray-300 dark:bg-gray-600'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm dark:text-gray-300">{m.name}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          m.status === 'RELEASED' ? 'text-green-600 bg-green-50 dark:bg-green-900/50 dark:text-green-300' :
                          m.status === 'VERIFIED' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-300' :
                          'text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {m.status === 'RELEASED' ? '✓ Bezahlt' :
                           m.status === 'VERIFIED' ? 'Geprüft' :
                           m.status === 'IN_PROGRESS' ? 'In Arbeit' :
                           m.status === 'PENDING' ? 'Ausstehend' :
                           m.status === 'DISPUTED' ? 'Streitfall' : m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
