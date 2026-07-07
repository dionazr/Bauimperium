'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './providers';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="font-bold text-xl dark:text-white">
                  Bau<span className="text-blue-600">imperium</span>
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Funktionen
              </Link>
              <Link href="#how-it-works" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                So funktioniert's
              </Link>
              <Link href="#pricing" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Preise
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Zum Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                    Anmelden
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Jetzt starten
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4">
            <div className="flex flex-col gap-3">
              <Link href="#features" className="text-sm text-gray-600 dark:text-gray-300 py-2">Funktionen</Link>
              <Link href="#how-it-works" className="text-sm text-gray-600 dark:text-gray-300 py-2">So funktioniert's</Link>
              <Link href="#pricing" className="text-sm text-gray-600 dark:text-gray-300 py-2">Preise</Link>
              <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Link href="/login" className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold">
                  Anmelden
                </Link>
                <Link href="/register" className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                  Registrieren
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-200/30 to-transparent dark:from-blue-800/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              🏗️ Der einzige Bau-Marktplatz mit Treuhandkonto
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-gray-900 dark:text-white">Bauen ohne</span>
              <br />
              <span className="gradient-text">Risiko &amp; Ärger</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Ihr Geld bleibt sicher auf dem Treuhandkonto, bis die Arbeit perfekt ist.
              KI-gestützte Qualitätskontrolle und nur geprüfte Meisterbetriebe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Projekt kostenlos einstellen
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-2xl text-lg font-semibold hover:border-blue-500 transition-colors"
              >
                So funktioniert's
              </Link>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '€0', label: 'Pfusch-Risiko', sub: 'durch Treuhand' },
              { value: '100%', label: 'Geprüfte Betriebe', sub: 'Meister & Bonität' },
              { value: '24h', label: 'Schnelle Vergabe', sub: 'durch KI-Matching' },
              { value: '0€', label: 'Büroarbeit', sub: 'für Handwerker' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{stat.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">So funktioniert's</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">In 6 einfachen Schritten zu Ihrem Traumprojekt</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Projekt beschreiben', description: 'Erzählen Sie uns einfach per Text oder Sprachnachricht, was Sie bauen möchten.', icon: '📝' },
              { step: '2', title: 'KI analysiert', description: 'Unsere KI erstellt ein präzises Lastenheft und sucht die passenden Betriebe.', icon: '🤖' },
              { step: '3', title: 'Top-Angebote', description: 'Nur die 3 besten Betriebe erhalten Ihr Projekt. Kein Massen-Anschreiben.', icon: '🎯' },
              { step: '4', title: 'Treuhandkonto', description: 'Ihr Geld liegt sicher auf einem Treuhandkonto. Freigabe nur bei Qualität.', icon: '🔒' },
              { step: '5', title: 'KI-Qualitätsprüfung', description: 'Nach jeder Bauphase prüft unsere KI die Arbeit per 3D-Videoanalyse.', icon: '✅' },
              { step: '6', title: 'Freigabe & Genießen', description: 'Alles perfekt? Geld wird freigegeben. Sie genießen Ihr neues Zuhause.', icon: '🏠' },
            ].map((item) => (
              <div key={item.step} className="relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Warum Bauimperium?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Wir eliminieren die 3 größten Risiken beim Bauen</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Kein Pfusch',
                description: 'KI-gestützte 3D-Videoanalyse prüft jede Bauphase auf Millimeter genau. Abweichungen werden sofort erkannt.',
                icon: '🔍',
                color: 'from-blue-500 to-blue-600',
              },
              {
                title: 'Kein Geld verlieren',
                description: 'Ihr Geld bleibt auf dem Treuhandkonto. Freigabe erst nach bestandener Qualitätsprüfung. Maximale Sicherheit.',
                icon: '💰',
                color: 'from-green-500 to-green-600',
              },
              {
                title: 'Keine schwarzen Schafe',
                description: 'Jeder Betrieb wird geprüft: Meisterbrief, Bonität, Haftpflichtversicherung. Nur die Besten arbeiten bei uns.',
                icon: '🛡️',
                color: 'from-purple-500 to-purple-600',
              },
            ].map((feature) => (
              <div key={feature.title} className="group relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white text-2xl mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Bereit für Ihr Projekt?</h2>
          <p className="text-xl text-blue-100 mb-8">Stellen Sie Ihr Projekt kostenlos ein und erhalten Sie Angebote von geprüften Top-Betrieben.</p>
          <Link
            href="/register"
            className="inline-flex items-center px-10 py-4 bg-white text-blue-700 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl hover:bg-blue-50 transition-all"
          >
            Kostenlos starten
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-xl text-white">Bauimperium</span>
            </div>
            <p className="text-sm">Der Premium Bau-Marktplatz mit Treuhandgarantie.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Für Bauherren</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Projekt einstellen</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">So funktioniert's</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Sicherheit</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Für Handwerker</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/craftsman" className="hover:text-white transition-colors">Registrieren</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Preise</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">SaaS Features</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Impressum</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">AGB</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Datenschutz</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          © 2024 Bauimperium GmbH. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
}
