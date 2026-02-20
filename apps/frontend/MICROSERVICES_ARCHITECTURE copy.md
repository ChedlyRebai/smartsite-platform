# SmartSite Platform - Microservices Architecture Documentation

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Shell)                         │
│           Micro-frontend Host Application                    │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │  Auth MFE    │ │Dashboard MFE │ │ Projects MFE │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              ↓
                     NGINX Reverse Proxy
                              ↓
                      API Gateway (Node.js)
                     (Load Balancing & Routing)
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓         ↓         ↓         ↓        ↓        ↓
    Auth    Projects   Team    Finance  QHSE  Notifications
   Service  Service   Service Service Service Service
```

## 🏗️ Services Structure

### 1. **API Gateway** (Port 3000)
- Central entry point for all requests
- Routes to appropriate microservices
- Handles authentication/authorization
- Load balancing

### 2. **Auth Service** (Port 3001)
- User authentication
- JWT token management
- User registration
- Password reset

### 3. **Projects Service** (Port 3002)
- Project management
- Project creation/update/delete
- Project status tracking

### 4. **Team Service** (Port 3003)
- Team member management
- Role assignment
- Team structure

### 5. **Finance Service** (Port 3004)
- Financial tracking
- Budget management
- Cost analysis

### 6. **QHSE Service** (Port 3005)
- Quality control
- Health & Safety
- Environment compliance

### 7. **Notifications Service** (Port 3006)
- Email notifications
- Push notifications
- In-app notifications

## 🚀 Deployment Options

### Option 1: Docker Compose (Development)
```bash
docker-compose up -d
```
Suitable for local development and testing.

### Option 2: Kubernetes (Production)
```bash
kubectl create namespace smartsite
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/database.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/frontend.yaml
```

## 🔧 Environment Variables

Create a `.env` file in each service:

**API Gateway (.env):**
```
PORT=3000
AUTH_SERVICE_URL=http://auth-service:3001
PROJECTS_SERVICE_URL=http://projects-service:3002
TEAM_SERVICE_URL=http://team-service:3003
FINANCE_SERVICE_URL=http://finance-service:3004
QHSE_SERVICE_URL=http://qhse-service:3005
NOTIFICATIONS_SERVICE_URL=http://notifications-service:3006
```

## 🐳 Docker Commands

**Build all services:**
```bash
docker-compose build
```

**Start all services:**
```bash
docker-compose up
```

**View logs:**
```bash
docker-compose logs -f api-gateway
```

**Stop all services:**
```bash
docker-compose down
```

## ☸️ Kubernetes Commands

**Deploy services:**
```bash
kubectl apply -f k8s/
```

**Check deployment status:**
```bash
kubectl get deployments -n smartsite
kubectl get pods -n smartsite
kubectl get services -n smartsite
```

**View logs:**
```bash
kubectl logs -n smartsite deployment/api-gateway
```

**Scale a service:**
```bash
kubectl scale deployment auth-service --replicas=3 -n smartsite
```

**Update a service:**
```bash
kubectl set image deployment/auth-service auth-service=smartsite/auth-service:v2 -n smartsite
```

## 📡 API Endpoints

**Base URL:** `http://localhost:3000/api` (Development)

### Auth
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Projects
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Team
- `GET /team` - List team members
- `POST /team` - Add team member
- `PUT /team/:id` - Update team member
- `DELETE /team/:id` - Remove team member

### Finance
- `GET /finance` - Get financial data
- `POST /finance` - Create financial record

### QHSE
- `GET /qhse` - Get QHSE data

### Notifications
- `GET /notifications` - Get notifications

## 🔐 Security

1. **Secrets Management:** Store sensitive data in Kubernetes Secrets or `.env.local`
2. **API Gateway Authentication:** Implement JWT validation
3. **Database:** Use strong passwords
4. **HTTPS:** Enable in production
5. **CORS:** Configure appropriately

## 📈 Scaling

Each service can scale independently:

```bash
# Docker Compose
docker-compose up --scale auth-service=3

# Kubernetes
kubectl scale deployment auth-service --replicas=3 -n smartsite
```

## 🔄 CI/CD Pipeline

Suggested pipeline with GitLab CI or GitHub Actions:
1. Build container images
2. Push to registry (Docker Hub, AWS ECR, etc.)
3. Deploy to development environment
4. Run integration tests
5. Deploy to staging
6. Deploy to production with approval

## 🛠️ Development Workflow

1. Each service is independent
2. Services communicate via REST APIs
3. Database per service (Database per service pattern)
4. Shared authentication via API Gateway

## ⚠️ Common Issues

1. **Service Not Found:** Check Docker networking or Kubernetes service DNS
2. **Port Conflicts:** Ensure ports 3000-3006 are available
3. **Database Connections:** Verify DATABASE_URL environment variables
4. **CORS Issues:** Configure CORS in API Gateway and services

## 📚 References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
