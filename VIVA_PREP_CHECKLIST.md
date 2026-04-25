# UniLib Viva Preparation Checklist

## 🔴 CRITICAL (Complete ASAP)

### GitHub Secrets Setup
- [ ] Navigate to: GitHub Repo → Settings → Secrets and variables → Actions
- [ ] Add secret: `ACR_LOGIN_SERVER` = `unilib9ef41d.azurecr.io`
- [ ] Add secret: `ACR_USERNAME` = [from Azure Portal → ACR → Access Keys]
- [ ] Add secret: `ACR_PASSWORD` = [from Azure Portal → ACR → Access Keys]
- [ ] Add secret: `GATEWAY_PUBLIC_ORIGIN` = [Your API Gateway public URL, e.g. `https://api-gateway-xxxxx.azurecontainerapps.io`]
- [ ] Push a test commit to main and verify GitHub Actions passes ✓

### SonarCloud Setup
- [ ] Go to: https://sonarcloud.io and sign in with GitHub
- [ ] Create new project: Select your UniLib repository
- [ ] Generate token: Account → Security → Generate New Token
- [ ] Add to GitHub: Settings → Secrets → `SONAR_TOKEN` = [token from SonarCloud]
- [ ] Verify `sonar-project.properties` exists at repo root
- [ ] Push a commit and verify SonarCloud scan completes ✓

### Verify Azure Deployment
- [ ] Login to Azure CLI: `az login`
- [ ] List running services: `az containerapp list --resource-group unilib-rg` (verify all 5+ apps are "Running")
- [ ] Test API Gateway: `curl https://[GATEWAY-URL]/health`
- [ ] Test Frontend: Open `https://[FRONTEND-URL]` in browser

---

## 🟡 HIGH PRIORITY (Before Viva)

### End-to-End Flow Testing
- [ ] **Register/Login:** Create account or login with admin credentials
- [ ] **Browse Books:** GET request to list all books returns data
- [ ] **Borrow Book:** POST to /loans with valid bookId
- [ ] **Check Notification:** Verify notification created for loan
- [ ] **Return Book:** POST to return endpoint
- [ ] **Verify Availability:** Book availability updated after return
- [ ] Document any issues and fix before viva

### Final Report (3-5 pages)
- [ ] **Title Page:** Project name, date, student info, group members
- [ ] **Executive Summary:** 1-2 paragraphs on what was built
- [ ] **Architecture Diagram:** Visual diagram showing all services + cloud
- [ ] **Microservice Descriptions:**
  - [ ] User Service: Role, endpoints, dependencies
  - [ ] Book Catalog Service: Role, endpoints, dependencies
  - [ ] Loan Service: Role, endpoints, inter-service calls
  - [ ] Notification Service: Role, endpoints, inter-service calls
  - [ ] API Gateway: Role, routing logic
- [ ] **Inter-Service Communication Section:** How services call each other with examples
- [ ] **DevOps Practices:** CI/CD pipeline, containerization, deployment process
- [ ] **Security Measures:** Authentication, secrets, SAST scans, HTTPS
- [ ] **Challenges & Solutions:** Issues faced and how they were resolved
- [ ] **Conclusion:** Summary of achievement
- [ ] **Appendices:** OpenAPI spec, architecture diagram, deployment URLs

### Architecture Diagram
- [ ] **Create visual diagram** showing:
  - 4 Microservices (boxes with brief description)
  - API Gateway (central routing point)
  - Frontend (SPA)
  - Database (MongoDB Atlas)
  - Azure Cloud boundary
  - Communication arrows with protocols (HTTP/HTTPS, port numbers)
- [ ] Export as PNG or SVG
- [ ] Save to: `docs/ARCHITECTURE_DIAGRAM.png` or similar
- [ ] Embed in final report

### Service README Files
- [ ] Create `services/user-service/README.md`
- [ ] Create `services/book-catalog-service/README.md`
- [ ] Create `services/loan-service/README.md`
- [ ] Create `services/notification-service/README.md`
- [ ] Each README should include: Purpose, Endpoints, Env Vars, Dependencies, Inter-service calls

---

## 🟢 MEDIUM PRIORITY (Before Viva)

### Demo Preparation
- [ ] **Write demo script:** Step-by-step what you'll demo (see template below)
- [ ] **Practice demo 5+ times:** Full walkthrough in 10 minutes
- [ ] **Record demo:** Have backup video in case of live issues
- [ ] **Test in browser:** Ensure URLs are accessible
- [ ] **Prepare fallback:** Have screenshots/Postman collection as backup

### Viva Demo Script Template
```
1. WELCOME (30 sec)
   "I've built UniLib, a library management system with 4 microservices"

2. SHOW ARCHITECTURE (1 min)
   - Display architecture diagram
   - Explain each service's role

3. SHOW FRONTEND (2 min)
   - Open https://[FRONTEND-URL]
   - Show login flow
   - Show book listing
   - Explain JWT token in network tab

4. DEMONSTRATE BORROW FLOW (2 min)
   - Select a book
   - Click borrow
   - Show request going through API Gateway → Loan Service
   - Show Loan Service calling Book Service + Notification Service
   - Show notification appears

5. SHOW CI/CD (2 min)
   - Make small code change (e.g., comment)
   - Push to main
   - Show GitHub Actions running
   - Show image being pushed to ACR
   - (Optional) Show Container App updating with new image

6. EXPLAIN SECURITY (1.5 min)
   - Show JWT token structure
   - Explain Container App secrets
   - Point to SonarCloud scan results
   - Explain internal vs external services

7. Q&A (1 min)
   - Be ready for: "What would you improve?", "How did you solve X issue?"
```

### Post-Viva Cleanup
- [ ] Delete Azure resource group if deploying is done: `az group delete --name unilib-rg --yes`
- [ ] Document any issues/learnings from viva

---

## 📋 VERIFICATION CHECKLIST (Day Before Viva)

### Code Repository
- [ ] All code is on main branch (no broken feature branches)
- [ ] No sensitive data (.env, passwords) committed
- [ ] .gitignore is configured properly
- [ ] README files are clear and helpful
- [ ] OpenAPI spec is up-to-date

### Deployment
- [ ] All services running on Azure: `az containerapp list --resource-group unilib-rg`
- [ ] Frontend URL is accessible in browser
- [ ] API Gateway URL is accessible
- [ ] Database connectivity verified (can login)
- [ ] All environment variables are set correctly

### Documentation
- [ ] Architecture diagram created and clear
- [ ] Final report is 3-5 pages
- [ ] All server endpoints documented in OpenAPI
- [ ] Deployment process documented in README
- [ ] Inter-service communication examples provided
- [ ] Security measures explained
- [ ] Challenges & solutions documented

### Demo Readiness
- [ ] Demo script written and rehearsed
- [ ] All required URLs bookmarked
- [ ] Postman collection or curl commands ready
- [ ] Screenshots/fallback materials prepared
- [ ] Talking points prepared for security/DevOps questions

### Assessment Criteria Coverage
- [ ] **Practicality & Functionality (10%):** Can demonstrate login → borrow → notify → return
- [ ] **DevOps & Cloud (30%):** Can explain CI/CD, containerization, deployment
- [ ] **Inter-Service Communication (10%):** Can show Loan→Book, Loan→Notification, Notif→User calls
- [ ] **Security & DevSecOps (20%):** Can explain JWT, secrets, SAST, HTTPS
- [ ] **Code Quality (20%):** Code is clean, error handling present, modular
- [ ] **Report & Demo Clarity (10%):** Report is professional, demo is clear

---

## 🎯 FINAL WEEK TIMELINE

### Monday
- [ ] Add GitHub Secrets
- [ ] Setup SonarCloud
- [ ] Verify CI/CD passes

### Tuesday
- [ ] Create architecture diagram
- [ ] Test end-to-end flow
- [ ] Prepare demo script

### Wednesday
- [ ] Write final report
- [ ] Create service README files
- [ ] Practice demo (1st time)

### Thursday
- [ ] Practice demo (2nd time)
- [ ] Fix any issues
- [ ] Review report

### Friday (Viva Day)
- [ ] Final demo practice (morning)
- [ ] Review talking points
- [ ] Navigate to URLs
- [ ] Demo at assignment time ✓

---

## 💡 Pro Tips for Viva

1. **Start with a high-level explanation** before diving into technical details
2. **Show the architecture diagram first** to set context
3. **Keep demos simple:** Don't try complex operations under pressure
4. **Have URLs ready:** Have all important URLs in browser tabs/bookmarks
5. **Explain the "why":** Emphasize design decisions and security choices
6. **Practice handling unexpected issues:** What if login fails? Have a backup plan
7. **Talk about challenges:** Examiners like hearing how you overcame obstacles
8. **Point out DevOps elements:** Explicitly call out CI/CD, containerization, cloud aspects
9. **Be confident:** You've done the work, just need to present it well
10. **Ask for clarification:** If a question is unclear, it's okay to ask for more details

---

**Status Tracking:**
- Start Date: April 4, 2026
- Viva Date: [To be determined]
- Target: **95%+ readiness by viva date**

**Last Updated:** April 4, 2026
