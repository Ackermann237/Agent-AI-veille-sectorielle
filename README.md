# FinanceWatch AI — Agent de Veille Sectorielle

FinanceWatch AI est un POC d’agent IA conçu pour automatiser la veille sectorielle.
Il analyse des documents (PDF, rapports, articles), extrait des tendances clés
et génère un rapport hebdomadaire avec validation humaine (human-in-the-loop).

## Fonctionnalités
- Upload de documents
- Analyse IA & extraction de tendances
- Validation humaine avant publication
- Génération de rapport PDF
- Historique des rapports

## Architecture
- Frontend : React + Tailwind
- Backend : Python (Flask / FastAPI)
- IA : LLM (via API)
- Gouvernance : Human-in-the-loop

## Sécurité
Les clés API sont stockées dans un fichier `.env` non versionné.

## Auteur
AMOUGOU André Désiré Junior
