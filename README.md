# RentRoom API

A RESTful API for a room rental system, built with Node.js, Express, and MySQL.

## Setup Instructions

### Option 1: Standard Setup

1. Make sure you have Node.js and MySQL installed on your system
2. Clone this repository
3. Install dependencies:
   ```
   npm install
   ```
4. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Update MySQL connection settings in `.env`

5. Setup the database (choose one method):

   a) Using the setup script:

   ```
   npm run setup-db
   ```

   b) Manually with MySQL CLI:

   ```
   mysql -u root -p < config/init.sql
   ```

   c) Using a MySQL client (like MySQL Workbench, phpMyAdmin):

   - Open the SQL client
   - Connect to your MySQL server
   - Run the SQL commands in `config/init.sql`

6. Start the server:
   ```
   npm run dev
   ```

### Option 2: Docker Setup

1. Make sure you have Docker and Docker Compose installed on your system
2. Clone this repository
3. Start the application with Docker Compose:

   ```
   docker-compose up
   ```

   This will:

   - Build the Node.js application image
   - Set up MySQL with the required database
   - Start both services
   - Initialize the database with sample data

4. The API will be available at `http://localhost:5000`

5. To stop the services:

   ```
   docker-compose down
   ```

6. To rebuild the images after changes:

   ```
   docker-compose up --build
   ```

7. To remove the volumes and start fresh:
   ```
   docker-compose down -v
   docker-compose up
   ```

## API Endpoints

- `/api/users` - User management
- `/api/categories` - Room categories
- `/api/utilities` - Room utilities
- `/api/posts` - Room listings
- `/api/packages` - Subscription packages
- `/api/payments` - Payment management

## Default Admin User

- Phone: 0123456789
- Password: admin123

## Database Migration Notes

This project has been migrated from MongoDB to MySQL. Key changes include:

1. **Database Structure**:

   - Relational database schema with proper foreign key constraints
   - Junction table for many-to-many relationships (PostUtilities)

2. **Data Model Changes**:

   - MongoDB ObjectId → MySQL auto-increment integers
   - MongoDB embedded documents → Normalized relational tables
   - MongoDB arrays → JSON text fields or related tables

3. **Query Differences**:
   - MongoDB queries replaced with Sequelize ORM queries
   - Nested document queries transformed to SQL JOINs
