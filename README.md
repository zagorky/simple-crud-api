# CRUD API

## 📋 Description

This project implements a **simple CRUD API** using an **in-memory database**.  
The API allows performing basic operations on user entities — creating, reading, updating, and deleting — following
RESTful principles.

---

## 🚀 Features

- **GET /api/users** – retrieve all users
- **GET /api/users/{userId}** – retrieve a specific user by ID
- **POST /api/users** – create a new user
- **PUT /api/users/{userId}** – update an existing user
- **DELETE /api/users/{userId}** – remove a user from the database
- Validation for invalid UUIDs and missing fields
- Graceful error handling for invalid routes and server errors
- Two runtime modes: `development` and `production`
- Optional horizontal scaling using Node.js Cluster API

---

## 🧩 User Model

Each user is represented as an object with the following structure:

```js
{
    id: 'uuid',        // generated on the server
        username
:
    'john', // string, require
        email
:
    '', // string, required
        password
:
    '', // string, required
        address
:
    '123 Main St', // string, required:
        'John',  // string, required
        age
:
    25,           // number, required
        hobbies
:
    ['chess', 'coding'] // array of strings, required
}
````

---

## ⚙️ Technical Stack

* **Language:** JavaScript / TypeScript
* **Runtime:** Node.js v24.x.x (24.14.0 or higher)
* **Dependencies:**

    * `nodemon`, `dotenv`, `cross-env`
    * `typescript`, `ts-node`, `ts-node-dev`
    * `eslint`, `prettier`
    * `webpack`, `webpack-cli`
    * `uuid`, `@types/*`
* **Testing:** any library (e.g., Jest, Supertest)

---

## 🧠 Error Handling

| Case             | Status Code | Description                 |
|------------------|-------------|-----------------------------|
| Invalid UUID     | 400         | User ID is not a valid UUID |
| User not found   | 404         | No record with such ID      |
| Missing fields   | 400         | Request body is incomplete  |
| Server error     | 500         | Internal server issue       |
| Invalid endpoint | 404         | Route does not exist        |

---

## 🧪 Example Test Scenarios

1. `GET /api/users` → returns an empty array
2. `POST /api/users` → creates a new user
3. `GET /api/users/{id}` → returns created user
4. `PUT /api/users/{id}` → updates user data
5. `DELETE /api/users/{id}` → deletes user
6. `GET /api/users/{id}` → returns 404 after deletion

---

## 🌍 Environment Configuration

All environment variables are stored in a `.env` file.
Example of `.env.example`:

```env
PORT=4000
```

> ⚠️ The `.env` file **must not** be committed to the repository.
> Add it to `.gitignore`.

---

## 🏗️ Scripts

| Command               | Description                                                                   |
|-----------------------|-------------------------------------------------------------------------------|
| `npm run start:dev`   | Runs the app in development mode with hot reload (`nodemon` or `ts-node-dev`) |
| `npm run start:prod`  | Builds the project and runs the bundled version                               |
| `npm run start:multi` | Starts multiple instances using Node.js Cluster API (load balancing)          |

---

## ⚖️ Load Balancing Mode (`start:multi`)

Example for `PORT=4000` and 4 CPU cores:

| Role          | Address              |
|---------------|----------------------|
| Load Balancer | `localhost:4000/api` |
| Worker 1      | `localhost:4001/api` |
| Worker 2      | `localhost:4002/api` |
| Worker 3      | `localhost:4003/api` |

Requests are distributed using a **Round-robin algorithm**, and the in-memory database remains consistent across
workers.

---

## 🧰 Local Setup

### 1. Clone repository

```bash
git clone git@github.com:zagorky/simple-crud-api.git
```

### 2. Checkout to the `dev` branch

```bash
git checkout dev
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create `.env` file

```bash
cp .env.example .env

```

### 3. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

```bash
cp .env.example .env
```

### 4. Run in development mode

```bash
npm run start:dev
```

### 5. Run in production mode

```bash
npm run start:prod
```

### 6. Run with clustering

```bash
npm run start:multi
```

---

## ✅ Project Structure

```
crud-api/
├── src/
│   ├── app.ts
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── utils/
├── tests/
├── .env.example
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

---

## 📎 Reference

This project is based on
the [RS School CRUD API assignment](https://github.com/rolling-scopes-school/tasks/blob/master/node/modules/crud-api/README.md).

---

**Author:** *[zagorky](https://github.com/zagorky)*
**Course:** Node.js 2025
