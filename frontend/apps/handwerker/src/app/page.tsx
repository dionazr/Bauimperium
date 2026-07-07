'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './providers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function CraftsmanLanding() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-xl dark:text-white">
                Bau<span className="text-green-600">imperium</span>
                <span className="text-sm font-normal text-gray-400 ml-2">Handwerker</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors">Funktionen</Link>
              <Link href="#pricing" className="text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors">Preise</Link>
              {isAuthenticated ? (
                <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700">
                  Zum Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-semibold hover:text-green-600 transition-colors">Anmelden</Link>
                  <Link href="/register" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                    Jetzt starten
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-green-950" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-medium mb-6">
              ⚡ Schluss mit Papierkram am Sonntag!
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-gray-900 dark:text-white">Ihr Handwerk.</span>
              <br />
              <span className="text-green-600">Unsere Technik.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              KI-gestützte Angebote in 30 Sekunden per Sprachnachricht, GoBD-konforme Rechnungen
              und neue Aufträge aus Ihrer Region – ohne Kaltakquise.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl hover:from-green-700 hover:to-green-800 transition-all"
              >
                Kostenlos anmelden
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* USP Grid */}
          <div className="mt-20 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: '🎤', title: 'Voice-to-Offer', desc: 'Diktieren Sie Angebote per Sprachnachricht – in 30 Sekunden fertig' },
              { icon: '📊', title: 'GoBD-konform', desc: 'Automatisches Rechnungswesen mit deutscher Steuerkonformität' },
              { icon: '🎯', title: 'Fertige Aufträge', desc: 'Erhalten Sie Projekte aus Ihrer Region – ohne teure Akquise' },
              { icon: '🤖', title: 'KI-Kalkulation', desc: 'Künstliche Intelligenz berechnet Material & Arbeitszeit präzise vor' },
              { icon: '🔒', title: 'Treuhand-Zahlung', desc: 'Ihr Geld ist sicher – Zahlung bei Meilensteinen automatisch' },
              { icon: '📱', title: 'Alles in einer App', desc: 'Angebote, Rechnungen, Termine und Projekte zentral verwalten' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-4">
                <div className="text-3xl flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Bereit für die digitale Zukunft?</h2>
          <p className="text-xl text-green-100 mb-8">Sparen Sie 10+ Stunden Büroarbeit pro Woche und gewinnen Sie neue Aufträge.</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center px-10 py-4 bg-white text-green-700 rounded-2xl text-lg font-bold shadow-xl hover:bg-green-50 transition-all"
            >
              Kostenlos starten
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
