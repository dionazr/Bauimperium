# 🏗️ Bauimperium – Das Digitale Bau-Imperium

[![CI/CD](https://img.shields.io/badge/CI%2FCD-Passing-brightgreen)](https://github.com/dionazr/Bauimperium)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow)](https://www.python.org/)

> **Der Premium Bau-Marktplatz mit Treuhandkonto, KI-Qualitätsprüfung und SaaS für Handwerker.**

Bauimperium transformiert das klassische, fehleranfällige Marktplatzmodell in eine hochprofitable, automatisierte Infrastruktur aus **Fintech** und **SaaS**. Statt Preiskampf setzen wir auf **„Amazon Prime für Premium-Bauen"** – mit eingebautem Treuhandkonto, KI-gestützter Qualitätskontrolle und strengem Vetting aller Betriebe.

---

## ✨ Features

### Für Bauherren
- 🛡️ **Treuhand-Garantie** – Geld wird erst freigegeben, wenn die KI die Qualität bestätigt
- 🤖 **KI-Projektanalyse** – Aus Freitext oder Sprachnachricht wird ein präzises Lastenheft
- 🎯 **Top-3-Matching** – Nur die besten Betriebe erhalten Ihr Projekt
- 📱 **Echtzeit-Tracking** – Live-Chat & Baufortschritt in Echtzeit

### Für Handwerker
- 🎤 **Voice-to-Offer** – Angebote per Sprachnachricht in 30 Sekunden
- 📊 **GoBD-konformes Rechnungswesen** – Automatisch & steuersicher
- 🔨 **Fertige Aufträge** – Projekte aus Ihrer Region ohne Kaltakquise
- 🤖 **KI-Kalkulation** – Automatische Material- & Arbeitszeitberechnung
- 💰 **Sichere Zahlungen** – Treuhand mit automatischer Meilenstein-Auszahlung

---

## 🏗️ Architektur

```
┌──────────────────────────────────────────────────────────────┐
│                       Nginx Reverse Proxy                     │
├──────────────────┬──────────────────┬────────────────────────┤
│  Bauherren-       │  Handwerker-     │  API (Express)         │
│  Frontend         │  SaaS-Dashboard  │  Port 4000             │
│  Port 3000        │  Port 3001       │  │                     │
├──────────────────┴──────────────────┴────────────────────────┤
│              AI Core (Python/Flask - Port 5000)                │
│    NLP-Analyse │ Computer Vision │ Matching Engine             │
├──────────────────────────────────────────────────────────────┤
│              PostgreSQL │ Redis │ Stripe API                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Voraussetzungen
- Node.js ≥ 18
- Python ≥ 3.11
- Docker & Docker Compose

### Installation

```bash
# 1. Repository klonen
git clone https://github.com/dionazr/Bauimperium.git
cd Bauimperium

# 2. Umgebungsvariablen
cp .env.example .env

# 3. Docker-Infrastruktur (PostgreSQL + Redis)
docker-compose up -d postgres redis

# 4. Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev

# 5. AI Core (separates Terminal)
cd ../ai-core
pip install -r requirements.txt
python src/app.py

# 6. Frontend: Bauherren-Portal
cd ../frontend/apps/bauherren
npm install
npm run dev

# 7. Frontend: Handwerker-Dashboard (separates Terminal)
cd ../handwerker
npm install
npm run dev
```

### Oder mit Docker Compose (alles in einem)

```bash
docker-compose up -d
```

### Zugänge nach DB-Seed

| Rolle | Email | Passwort |
|-------|-------|----------|
| 👑 Admin | admin@bauimperium.de | Test1234! |
| 🔧 Handwerker | m.schmidt@bauprofi.de | Test1234! |
| 🔧 Handwerker | s.wagner@handwerk.de | Test1234! |
| 🏠 Bauherr | thomas.mueller@gmail.com | Test1234! |
| 🏠 Bauherr | sarah.klein@web.de | Test1234! |

---

## 📂 Projekt-Struktur

```
Bauimperium/
├── frontend/
│   ├── apps/
│   │   ├── bauherren/          # Bauherren-Portal (Next.js)
│   │   └── handwerker/         # Handwerker-Dashboard (Next.js)
│   └── packages/
│       ├── ui/                 # Gemeinsame UI-Komponenten
│       └── shared/             # Type-Definitionen & Utils
├── backend/
│   ├── src/
│   │   ├── api/routes/         # REST-API Endpunkte
│   │   ├── middleware/         # Auth, Validation, Upload
│   │   └── config/             # Konfiguration
│   ├── prisma/
│   │   └── schema.prisma      # Datenbank-Schema (24 Modelle)
│   └── tests/
├── ai-core/
│   ├── src/
│   │   ├── nlp/               # Sprachverarbeitung
│   │   ├── vision/            # Computer Vision
│   │   └── matching/          # Matching-Algorithmus
│   └── models/
├── infrastructure/
│   ├── nginx/                 # Reverse-Proxy Konfiguration
│   ├── terraform/             # Cloud-Infrastruktur (Hetzner)
│   └── kubernetes/            # K8s Deployment
└── docs/
    └── blueprint.md           # Vollständiger Strategie-Blaupause
```

---

## 💼 API-Übersicht

| Kategorie | Endpoints | Beschreibung |
|-----------|-----------|--------------|
| **Auth** | `/api/v1/auth/*` | Registrierung, Login, Refresh-Tokens |
| **Projekte** | `/api/v1/projects/*` | CRUD, Veröffentlichung, Bewerbung |
| **Handwerker** | `/api/v1/craftsmen/*` | Profile, Kategorien, Verfügbarkeit |
| **Angebote** | `/api/v1/offers/*` | Erstellung (KI/manuell), Annahme |
| **Treuhand** | `/api/v1/escrow/*` | Konten, Freigabe, Dispute |
| **Rechnungen** | `/api/v1/invoices/*` | GoBD-konforme Rechnungen |
| **Abos** | `/api/v1/subscriptions/*` | Pläne, Anmeldung, Kündigung |
| **Chat** | `/api/v1/messages/*` | Echtzeit-Nachrichten |
| **KI** | `/api/v1/ai/*` | Analyse, Generierung, Prüfung |
| **Material** | `/api/v1/materials/*` | Bestellungen, Lieferanten |
| **Admin** | `/api/v1/admin/*` | Dashboard, Verifikation |

**Vollständige API-Dokumentation:** [api.md](docs/api.md)

---

## 💎 Die 4 Umsatzströme

| Umsatzstrom | Beschreibung | Beispielrechnung |
|------------|--------------|------------------|
| **Transaktionsgebühr** | 2-3% vom Auftraggeber + 3-5% vom Handwerker | €300k Hausbau → bis €15k Einnahmen |
| **B2B SaaS-Abo** | €199/Monat pro Nutzer für Premium-Features | 1.000 Betriebe → €199k/Monat MRR |
| **Fintech (Float)** | Zinserträge aus Treuhandgeldern | €100M float → ~€2.5M/Jahr |
| **Kickbacks** | ~5% Provision auf Baustoffe | €10M Materialvolumen → €500k |

---

## 🛡️ Sicherheit

- **Escrow-System:** Alle Gelder auf Treuhandkonten mit phasenweiser Freigabe
- **KYC/KYB:** Automatisierte Identitäts- und Bonitätsprüfung
- **KI-Qualitätskontrolle:** 3D-Videoanalyse vor jeder Auszahlung
- **SSL/TLS:** Verschlüsselung in Transit und at Rest
- **JWT:** Token-basierte Authentifizierung mit Refresh-Rotation
- **Rate Limiting:** Schutz vor Brute-Force und API-Missbrauch

---

## 🧪 Tech-Stack

| Komponente | Technologie |
|------------|-------------|
| **Frontend** | Next.js 14, React 18, TailwindCSS, TypeScript |
| **Backend** | Node.js, Express, Prisma, PostgreSQL |
| **AI Core** | Python, Flask, PyTorch, OpenAI API |
| **Payment** | Stripe Connect, Stripe API |
| **Realtime** | Socket.IO, Redis |
| **Infrastructure** | Docker, Kubernetes, Terraform |

---

## 📈 Roadmap

- [x] MVP mit Kernfunktionen (Projekte, Angebote, Escrow)
- [x] KI-gestützte Angebotserstellung
- [x] GoBD-konformes Rechnungswesen
- [ ] Mobile Apps (iOS/Android) mit React Native
- [ ] 3D-Grundriss-Viewer Integration
- [ ] ERP-Schnittstellen (DATEV, Lexware)
- [ ] Baustoff-Marktplatz mit Live-Beständen
- [ ] KI-Bauzeitplan-Optimierung
- [ ] Versicherungs-Integration

---

## 🤝 Contributing

Wir freuen uns über Beiträge! Bitte lesen Sie [CONTRIBUTING.md](CONTRIBUTING.md) für Details.

1. Fork erstellen
2. Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committen (`git commit -m 'Add AmazingFeature'`)
4. Pushen (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

---

## 📄 Lizenz

MIT License – siehe [LICENSE](LICENSE) für Details.

---

## 👥 Team

- **Dion Aziri** – Gründer & CEO

---

## 📬 Kontakt

- Website: [bauimperium.de](https://bauimperium.de)
- Email: hello@bauimperium.de
- Twitter/X: [@bauimperium](https://x.com/bauimperium)

---

<div align="center">
  <strong>Bauen ohne Risiko. Mit KI-Qualitätssicherung und Treuhand-Garantie.</strong>
  <br />
  <sub>Made with ❤️ in München, Germany</sub>
</div>
