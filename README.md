# 📚 College Compliance Tracking System

A full-stack web application to manage and track student compliance issues in colleges.
Built with **React (Vite), Node.js, Express, MongoDB**, and deployed using **Vercel + Render + Cloudinary**.

---

## 🚀 Live Demo

* 🌐 Frontend: https://frontend-mini-eight.vercel.app
* ⚙️ Backend API: https://backend-mini-9n1r.onrender.com

---

## 🧠 Features

### 👨‍🏫 Staff Dashboard

* Report compliance issues
* Upload evidence images (Cloudinary ☁️)
* Track student violations
* View repeat offenders & warning levels

### 🎓 Student Dashboard

* View violations
* Upload correction proof
* Track status (Pending → Verified)
* Receive warnings & escalation alerts

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* TypeScript
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication

### Cloud & Deployment

* Vercel (Frontend)
* Render (Backend)
* Cloudinary (Image Uploads)

---

## 📂 Project Structure

```
college-compliance/
│
├── frontend/         # React app (Vite)
├── backend/          # Express server
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── config/
│
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (.env)

```
PORT=10000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📦 Installation

### 1️⃣ Clone the repo

```
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

---

### 2️⃣ Backend setup

```
cd backend
npm install
npm run dev
```

---

### 3️⃣ Frontend setup

```
cd frontend
npm install
npm run dev
```

---

## 🚀 Deployment

### Frontend (Vercel)

* Connect GitHub repo
* Add environment variable:

```
VITE_API_URL=https://your-backend-url
```

---

### Backend (Render)

* Create Web Service
* Add environment variables
* Deploy

---

## 📸 Image Upload

* Images are uploaded using **Cloudinary**
* Stored securely in cloud
* Returned as public URLs

---

## 🔐 Authentication

* JWT-based authentication
* Protected routes for staff & students

---

## 🧪 API Endpoints

### Auth

* POST `/api/auth/login`
* POST `/api/auth/register`

### Violations

* GET `/api/violations`
* POST `/api/violations`
* PATCH `/api/violations/:id`

### Upload

* POST `/api/upload/evidence`
* POST `/api/upload/correction`

---

## 🎯 Future Improvements

* Google / GitHub login
* Admin dashboard
* Email notifications
* Analytics dashboard

---

## 👨‍💻 Author

**Ranjith**

---

## ⭐ If you like this project

Give it a ⭐ on GitHub!
