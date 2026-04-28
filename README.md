# SmartSite Platform – Construction Site Management Application

## Overview
This project was developed as part of the PIDEV program in the 3rd year engineering curriculum at **Esprit School of Engineering** (Academic Year 2025–2026).

SmartSite Platform is a full-stack web application designed to manage construction sites through a microservices architecture. It centralizes site operations such as project planning, materials and suppliers management, incident handling, user authentication, and resource optimization, while providing a modern frontend for operational monitoring and decision support.

## Features
- Full-stack construction site management platform
- Microservices-based backend architecture
- Site and project management modules
- Materials, suppliers, and logistics workflows
- Incident tracking and notification services
- Resource optimization and analytics modules
- AI-assisted features in selected services
- CI/CD-ready backend services with containerization support

## Tech Stack

### Frontend
- React
- Vite
- JavaScript/TypeScript ecosystem
- MUI, Radix UI, Tailwind ecosystem
- Recharts and Leaflet for visualization and maps

### Backend
- Node.js
- NestJS (TypeScript)
- MongoDB
- REST APIs
- Docker
- Jenkins and SonarQube (in several service pipelines)

## Architecture
Monorepo structure:

- apps/frontend: Web client (React + Vite)
- apps/backend: Backend microservices, including:
  - api-gateway
  - user-authentication
  - gestion-site
  - gestion-projects
  - gestion-planing
  - materials-service
  - gestion-fournisseurs / gestion-suppliers
  - incident-management
  - resource-optimization
  - notification
  - paiement
  - videocall

## Contributors
- PIDEV Student Team – SmartSite
- team member:
  - Chedly Rebai
  - Asma Mhamdi
  - Ghada Bannouri
  - Mahmoud Hasnaoui
  - Donia Maazoun

## Academic Context
Developed at **Esprit School of Engineering – Tunisia**  
PIDEV – 4 TWIN 5 | 2025–2026

## Getting Started
### Prerequisites
- Node.js (recommended LTS)
- npm
- MongoDB (local or cloud instance)

### Installation
1. Clone the repository
2. Install dependencies from project root:
   - npm install

### Run Frontend
- npm run dev

### Run Backend Microservices
- npm run microservices:start

### Run Backend Microservices with Kafka
- npm run microservices:start:kafka

## Acknowledgments
- Academic supervision and project framework provided by **Esprit School of Engineering**
- Open-source technologies and communities behind React, NestJS, MongoDB, and Vite
- All contributors who participated in the SmartSite platform development

## Hosting and Deployment (Recommended)
Recommended deployment options include:
- GitHub Pages (for static frontend hosting)
- Container-based cloud deployment for backend microservices (Docker-compatible platforms)
