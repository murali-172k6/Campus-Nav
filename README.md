# 🗺️ Smart Campus Navigation System

An interactive, dynamic, and mobile-responsive campus navigation and utility platform built for students, visitors, and administrators. The system features custom A* routing, interactive maps, role-based dashboards, and a full administrative suite.

---

## 🚀 Features

### 📍 Smart Navigation & Interactive Map
*   **Dynamic 2D Routing**: Optimized navigation utilizing an asynchronous A* search algorithm operating strictly on coordinates.
*   **Intelligent Location Snapping**: Admins can dynamically add new locations through the UI, which automatically connect ("snap") to the nearest pathway node in the campus graph.
*   **Custom Marker Theme**: Location markers are color-coded dynamically based on categories (e.g., Labs, Food, Hostels, Parking).
*   **Smooth Paths**: Route lines are rendered elegantly using custom Bezier splines.
*   **Priority Modes**: Route calculations can optimize for *Fastest*, *Shortest*, or *Least Crowded* paths, and support wheelchair-accessible routing.

### 🎓 Student Dashboard
*   **Recent Navigation History**: Keep track of previous routes with an option to instantly clear navigation history.
*   **Favorite Locations**: Save frequently visited spots for quick reference.
*   **Academic Timetable**: Displays a weekly schedule that automatically highlights classes for "Today". Timetables dynamically sync with the student's registered branch (e.g., CSD, ECE).
*   **Bus Schedule Tracker**: Access real-time public transit status and complete route schedules.
*   **Canteen Menu & Crowd Indicator**: Live crowd-level reports and standard daily menus.
*   **Grades & Support Hub**: View semester marks and submit feedback or suggestions directly to system administrators.

### 🛡️ Administrative Portal
*   **Dynamic Location Manager**: Add, edit, or remove campus coordinates and descriptions in real-time.
*   **Dynamic Timetable Manager**: Create, list, and edit schedules for specific semesters and academic branches.
*   **System Analytics**: View metrics such as total search queries, live active users, popular destinations, and wheelchair route requests.
*   **Feedback Moderation**: Read and delete student feedback logs.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Hooks, Context API), Vite, Tailwind CSS, Leaflet/React-Leaflet, Lucide React
*   **Backend**: Node.js, Express, JWT Authentication, CORS
*   **Database**: MongoDB, Mongoose ODM

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB installed and running locally

### 1. Clone the repository and navigate to the project directory:
```bash
git clone https://github.com/murali-172k6/Campus-Nav.git
cd Campus-Nav
```

### 2. Configure Backend:
1.  Navigate to the `backend/` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on `.env.example`:
    ```env
    MONGO_URI=mongodb://127.0.0.1:27017/campusnav
    JWT_SECRET=your_jwt_secret_here
    PORT=5001
    ```

### 3. Configure Frontend:
1.  Navigate to the `frontend/` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on `.env.example` (or let it dynamically resolve to the browser hostname):
    ```env
    VITE_API_URL=http://localhost:5001
    ```

---

## 🏃 Running the Application

### 💻 Local Desktop Mode
Run both backend and frontend on your local PC:

1.  **Start Backend**:
    ```bash
    cd backend
    ```
    ```bash
    npm run dev
    ```
2.  **Start Frontend**:
    In a new terminal window:
    ```bash
    cd frontend
    ```
    ```bash
    npm run dev
    ```
3.  Open **`http://localhost:5173`** in your browser.

### 📱 Network/Mobile Testing
To run the project so that devices on the same Wi-Fi network (like mobile phones) can connect:

1.  **Start Backend**: It binds to `0.0.0.0` automatically to accept external network traffic:
    ```bash
    cd backend
    ```
    ```bash
    npm run dev
    ```
2.  **Start Frontend**: Run the mobile host script:
    ```bash
    cd frontend
    ```
    ```bash
    npm run mobile
    ```
    *This automatically detects your computer's local IP address (e.g. `10.97.97.6`), creates the connection config, and runs the Vite server publicly. Open **`http://<your-local-ip>:5173`** on your mobile browser.*
