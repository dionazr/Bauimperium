# Das Digitale Bau-Imperium: Strategischer & Technischer Blueprint

## Executive Summary

**Bauimperium** transformiert den klassischen Handwerker-Marktplatz in eine hochprofitable, automatisierte Infrastruktur aus Fintech und SaaS. Statt des typischen Preiskampfes setzen wir auf eine **„Amazon Prime für Premium-Bauen“**-Positionierung mit eingebautem Treuhandkonto, KI-Qualitätsprüfung und strengem Vetting.

---

## 1. Strategische Roadmap & Business-Modell

### 1.1 Marktpositionierung (Anti-MyHammer-Prinzip)

- **Risiko-Eliminierung:** Geld auf Treuhandkonten (Escrow) – Freigabe nur bei verifizierter Qualität
- **Strenges Vetting:** Bonitäts-, Meister- und Haftpflichtprüfung für alle Betriebe
- **Bürokratie-Vernichtung:** KI-gestützte SaaS-Module sparen Handwerkern Stunden Büroarbeit

### 1.2 Die 4 Umsatzströme

| Umsatzstrom | Beschreibung | Margen-Potential |
|------------|--------------|------------------|
| **Transaktionsgebühr** | 2-3% vom Auftraggeber, 3-5% vom Auftragnehmer | Bis €15.000 pro Hausbau (€300k) |
| **B2B SaaS-Abo** | €199/Monat pro Nutzer für Premium-Features | Wiederkehrend, hohe Margen |
| **Fintech (Float)** | Zinserträge aus Treuhandgeldern | Millionen bei Skalierung |
| **Großhandels-Kickbacks** | ~5% Provision auf Baustoff-Bestellungen | Milliarden-Volumen |

---

## 2. Software-Architektur

### 2.1 System-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                     Nginx Reverse Proxy                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Bauherren-      │  Handwerker-     │  API Gateway            │
│  Frontend        │  Dashboard      │  (Backend)              │
│  (Next.js:3000) │  (Next.js:3001)  │  (Express:4000)         │
├─────────────────┴─────────────────┴─────────────────────────┤
│                    AI Core (Python/Flask:5000)                │
│         NLP │ Computer Vision │ Matching Engine              │
├─────────────────────────────────────────────────────────────┤
│              PostgreSQL │ Redis │ Stripe API                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Kernkomponenten

#### Bauherren-Frontend
- KI-Projekt-Konfigurator
- 3D-Grundriss-Integration
- Baufinanzierungs-Rechner
- Live-Chat & Baufortschritts-Timeline
- **Stack:** Next.js, React Native (iOS/Android), TailwindCSS

#### Handwerker SaaS-Dashboard
- KI-Angebotserstellung via Voice-to-Text
- GoBD-konformes Rechnungswesen
- Projekt- & Ressourcenplaner
- Digitales Abnahmeprotokoll
- **Stack:** React, Node.js, PostgreSQL

#### KI- & Automations-Core
- Computer Vision für 3D-Videoanalyse
- NLP für Lastenheft-Generierung (DIN-Normen)
- Automatischer Matching-Algorithmus
- **Stack:** Python, PyTorch, OpenAI API

#### Fintech & Escrow-Infrastruktur
- Automatisierte Treuhandkonten
- Phasenbasierte Auszahlungs-Trigger
- KYC/KYB-Prüfung
- **Stack:** Stripe Connect, Mangopay

### 2.3 Daten- & Prozessfluss

```
1. Ausschreibung → 2. KI-Analyse (NLP + Vision)
       ↓
3. Smart-Matching (Top 3 Betriebe)
       ↓
4. Angebot & Finanzierung
       ↓
5. Einzahlung Escrow (Geld sicher)
       ↓
6. Autonome KI-Abnahme (3D-Video)
       ↓
   Geldfreigabe → Nächste Phase
```

---

## 3. Technische Details

### Datenbank-Schema (Prisma)
- **24 Modelle** (User, Project, Offer, Milestone, Escrow, Invoice, etc.)
- Vollständige Relations-Modellierung
- PostgreSQL mit Indizes und Constraints

### API-Endpunkte (REST)
- `/api/v1/auth` – Authentifizierung & User-Management
- `/api/v1/projects` – Projekt-CRUD & Matching
- `/api/v1/craftsmen` – Handwerker-Profile
- `/api/v1/offers` – Angebotserstellung (KI & manuell)
- `/api/v1/escrow` – Treuhandkonten & Auszahlungen
- `/api/v1/invoices` – GoBD-konforme Rechnungen
- `/api/v1/subscriptions` – SaaS-Abos & Pläne
- `/api/v1/messages` – Echtzeit-Chat
- `/api/v1/reviews` – Bewertungssystem
- `/api/v1/materials` – Baustoff-Bestellungen
- `/api/v1/admin` – Admin-Dashboard
- `/api/v1/ai` – KI-Analyse & Generierung

### AI Core Endpunkte
- `POST /api/v1/analyze/project` – Projektanalyse
- `POST /api/v1/generate/offer` – Angebotsgenerierung
- `POST /api/v1/verify/construction` – 3D-Bauprüfung
- `POST /api/v1/match/craftsmen` – Smart Matching
- `POST /api/v1/transcribe` – Sprache-zu-Text
- `POST /api/v1/parse/invoice` – Rechnungsparsing

---

## 4. Der unfaire Burggraben (Moat)

1. **SaaS Lock-in:** Handwerker wickeln ihre gesamte Buchhaltung über uns ab → Wechsel unmöglich
2. **Vertrauens-Vorsprung:** Bauherren erkennen, dass nur wir Pfusch und Totalverlust eliminieren
3. **Netzwerk-Effekte:** Mehr Handwerker → mehr Projekte → mehr Handwerker (zweiseitiger Marktplatz)
4. **Daten-Monopol:** Wir kennen die Preise, Qualität und Kapazitäten jeder Firma in Deutschland
5. **Fintech-Moat:** Hunderte Millionen Euro Float generieren Zinserträge, die Wettbewerber nicht haben

---

## 5. Quick Start

```bash
# 1. Repository klonen
git clone https://github.com/dionazr/Bauimperium.git
cd Bauimperium

# 2. Umgebungsvariablen
cp .env.example .env

# 3. Docker-Infrastruktur starten (PostgreSQL, Redis)
docker-compose up -d postgres redis

# 4. Backend starten
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# 5. AI Core starten
cd ../ai-core
pip install -r requirements.txt
python src/app.py

# 6. Frontends starten
cd ../frontend/apps/bauherren
npm install && npm run dev

cd ../handwerker
npm install && npm run dev
```

---

## 6. Deployment

### Docker (Entwicklung)
```bash
docker-compose up -d
```

### Kubernetes (Produktion)
```bash
kubectl apply -f infrastructure/kubernetes/
```

### Terraform (Cloud-Infrastruktur)
```bash
cd infrastructure/terraform
terraform init
terraform apply
```

---

## 7. Test-Zugänge (nach DB-Seed)

| Rolle | Email | Passwort |
|-------|-------|----------|
| Admin | admin@bauimperium.de | Test1234! |
| Handwerker | m.schmidt@bauprofi.de | Test1234! |
| Handwerker | s.wagner@handwerk.de | Test1234! |
| Bauherr | thomas.mueller@gmail.com | Test1234! |
| Bauherr | sarah.klein@web.de | Test1234! |

---

*„Bauen ohne Risiko. Mit KI-Qualitätssicherung und Treuhand-Garantie."*
