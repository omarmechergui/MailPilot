# MailPilot 

**A Modern Bulk Email Campaign Management Platform**

MailPilot is a web-based application designed to simplify bulk email communication through contact management, campaign creation, recipient selection, and email delivery monitoring.

The project is being developed with a focus on usability, secure authentication, reliable email delivery, and clear campaign reporting.

## ✨ Features

- **Authentication** — Secure password-based authentication and administrator initialization.
- **Dashboard** — A centralized workspace for managing email campaigns and contacts.
- **Contact Management** — Organize contacts, manage subscription status, and filter recipients.
- **Campaign Management** — Create, edit, and manage email campaign drafts.
- **Recipient Selection** — Select individual contacts or multiple recipients for a campaign.
- **Email Delivery** — SMTP-based email delivery using Nodemailer.
- **Email Testing** — Test email delivery locally using Mailpit without sending messages to real recipients.
- **Campaign History** — Track campaign activity and preserve delivery records.
- **Reporting** — Export contact data and campaign reports to CSV.
- **Error Handling** — Retry failed email deliveries and record persistent failures.

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, JavaScript |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| ORM | Prisma |
| Database | MongoDB Atlas |
| Authentication | JWT |
| Password Hashing | Argon2 |
| Email Delivery | Nodemailer |
| Development SMTP | Mailpit |
| Package Manager | pnpm |

## 📁 Project Structure

```text
MailPilot/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── app/
│   ├── components/
│   └── package.json
├── docs/
├── .agents/
├── .env.example
├── .gitignore
├── AGENTS.md
└── README.md
```

*The structure may evolve as development continues.*

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Mailpit](https://mailpit.axllent.org/) for local email testing

### 1. Clone the Repository

```bash
git clone https://github.com/omarmechergui/MailPilot.git
cd MailPilot
```

### 2. Configure Environment Variables

Create the required environment files based on the provided `.env.example`.

Configure your MongoDB connection, authentication secrets, administrator initialization token, and SMTP settings.

**Never commit real credentials or `.env` files to GitHub.**

### 3. Install Dependencies

Install the dependencies for the backend and frontend using the package manager and workspace configuration provided by the project.

### 4. Configure the Database

Set your MongoDB Atlas connection string in the appropriate environment file.

Run the database connection and health checks before starting the application.

### 5. Initialize the Administrator

Use the project's administrator initialization script:

```powershell
.\init-admin.ps1
```

Run this command from the directory containing the script, after configuring the required environment variables and starting the backend if required by the script.

### 6. Start the Application

Start the backend and frontend using their configured development scripts.

Once both services are running, open the frontend at:

```text
http://localhost:3000
```

### 7. Test Email Delivery Locally

Configure Mailpit as the development SMTP server.

Default local settings:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
```

Open the Mailpit web interface:

```text
http://localhost:8025
```

Emails sent through the local Mailpit SMTP server can be inspected in its web interface instead of being delivered to real inboxes.

## 🔐 Security

MailPilot is designed with security-conscious development practices:

- Password hashing.
- JWT-based authentication.
- Environment-based secret management.
- Protected administrator initialization.
- Centralized API error handling.
- Separation of frontend and backend responsibilities.

Never expose authentication secrets, database credentials, or SMTP passwords in source control.

## 🧪 Testing

Run the available tests from the appropriate project directory.

For example, backend tests can be executed with:

```bash
cd backend
pnpm test
```

## 🗺️ Roadmap

Potential areas for further development include:

- Campaign scheduling.
- Advanced analytics and delivery statistics.
- Improved campaign segmentation.
- Production SMTP provider integration.
- Background job processing for larger campaigns.
- Deployment and production monitoring.

## 👨‍💻 Author

**Omar Mechergui**

- GitHub: [@omarmechergui](https://github.com/omarmechergui)
- Repository: [MailPilot](https://github.com/omarmechergui/MailPilot)

## 📌 Project Status

MailPilot is under active development. Features, configuration requirements, and project structure may change as new functionality is implemented.
