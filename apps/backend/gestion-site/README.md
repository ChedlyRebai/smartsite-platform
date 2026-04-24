# Gestion Site API

NestJS microservice for managing construction sites.

## 🚀 Deployment

**Production URL:** [https://smartsite-gestion-site.onrender.com](https://smartsite-gestion-site.onrender.com)

## 📋 Available Endpoints


| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gestion-sites` | Create a new site |
| GET | `/api/gestion-sites` | Get all sites (paginated) |
| GET | `/api/gestion-sites/statistics` | Get site statistics |
| GET | `/api/gestion-sites/budget/total` | Get total budget |
| GET | `/api/gestion-sites/active` | Get active sites |
| GET | `/api/gestion-sites/:id` | Get site by ID |
| GET | `/api/gestion-sites/search/nom/:nom` | Search by name |
| GET | `/api/gestion-sites/localisation/:localisation` | Find by location |
| PUT | `/api/gestion-sites/:id` | Update a site |
| DELETE | `/api/gestion-sites/:id/soft` | Soft delete a site |
| POST | `/api/gestion-sites/:id/restore` | Restore a soft-deleted site |
| DELETE | `/api/gestion-sites/:id` | Hard delete a site |
| POST | `/api/gestion-sites/:id/teams` | Add team member to site |
| DELETE | `/api/gestion-sites/:id/teams/:userId` | Remove team member from site |
| GET | `/api/gestion-sites/:id/teams` | Get site teams |
| GET | `/api/gestion-sites/teams/all` | Get all teams |
| GET | `/api/gestion-sites/teams/assigned-ids` | Get assigned team IDs |
| GET | `/api/gestion-sites/teams/:teamId/sites` | Get sites by team |

## 🛠️ Running Locally

```bash
npm install
npm run start:dev
```

The API will be available at `http://localhost:3008/api`.
