# Expense Tracker Two

A modern, collaborative expense tracking application built with React, Vite, and Supabase. Easily split bills, manage shared accounts, and track expenses with friends and family.

## 🚀 Data Stack & Technologies

*   **Frontend Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) (Icons)
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL + Auth)
*   **State Management:** React Hooks (`useState`, `useEffect`, Custom Hooks)

## ✨ Features

*   **🔐 User Authentication:**
    *   Secure login/signup via Supabase Auth.
    *   Automatic profile creation with random avatars for new users.
    *   Profile management (Name, Avatar).

*   **👥 Shared Accounts (Groups):**
    *   Create multiple accounts (e.g., "Home", "Trip to Italy").
    *   Add members to accounts.
    *   Real-time member lists.

*   **💸 Expense Management:**
    *   Add expenses with title, amount, date, and payer.
    *   **Smart Splitting:** Automatically splits expenses among selected participants.
    *   Edit and Delete expenses.
    *   **Bulk Import:** Import expenses from external sources (supports custom date formats).

*   **⚖️ Reconciliation & Balances:**
    *   Visual "Who owes who" dashboard.
    *   Real-time balance calculation.
    *   Track pending payments and settlements.

## 🗄️ Database Schema

The comprehensive Postgres schema handles users, groups, and complex expense relationships.

### Tables

1.  **`profiles`**
    *   Stores user details linked to Supabase Auth.
    *   `id` (PK, references auth.users), `email`, `full_name`, `avatar_url`.

2.  **`accounts`**
    *   Represents a shared ledger or group.
    *   `id` (PK), `name`, `owner_id`, `created_at`.

3.  **`account_members`**
    *   Links users to accounts (Many-to-Many).
    *   `id` (PK), `account_id`, `user_id`, `joined_at`.

4.  **`expenses`**
    *   The main expense record.
    *   `id` (PK), `account_id`, `created_by`, `title`, `amount`, `date`.

5.  **`expense_shares`**
    *   Tracks individual debt/share for each expense.
    *   `id` (PK), `expense_id`, `user_id`, `amount`, `status` ('PENDING'/'PAID').

### Security (RLS)
Row Level Security is enabled on all tables to ensure users can only access data for accounts they belong to.

## 🛠️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone params...
    cd expense-tracker-two
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory (based on `.env.example` if available) with your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

4.  **Database Setup**
    Run the SQL scripts located in `bbdd-commands/supabase_schema.sql` in your Supabase SQL Editor to set up the tables and security policies.

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📜 Scripts

*   `npm run dev`: Start the development server.
*   `npm run build`: Build the app for production.
*   `npm run lint`: Run ESLint to check for code quality.
*   `npm run preview`: Preview the production build locally.

---
Built with ❤️ by [Your Name/Team]
