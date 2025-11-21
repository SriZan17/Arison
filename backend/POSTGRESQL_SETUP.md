# PostgreSQL Database Configuration for CMD Transparency Platform

## Environment Variables

Create a `.env` file in the backend directory with your PostgreSQL credentials:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cmd_transparency

# Alternative: Full database URL
# DATABASE_URL=postgresql://postgres:password@localhost:5432/cmd_transparency
# ASYNC_DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/cmd_transparency
```

## PostgreSQL Setup Instructions

### 1. Install PostgreSQL

#### On Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the 'postgres' user

#### On macOS:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create a database
createdb cmd_transparency
```

#### On Ubuntu/Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql
```

### 2. Create Database and User

Connect to PostgreSQL and create the database:

```sql
-- Connect to PostgreSQL (as postgres user)
psql -U postgres -h localhost

-- Create database
CREATE DATABASE cmd_transparency;

-- Create user (optional - for better security)
CREATE USER cmd_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cmd_transparency TO cmd_user;

-- Connect to the new database
\c cmd_transparency

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO cmd_user;

-- Exit
\q
```

### 3. Update Environment Variables

Update your `.env` file with the correct credentials:

```env
DB_USER=cmd_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cmd_transparency
```

### 4. Install Python Dependencies

```bash
pip install psycopg2-binary asyncpg databases[postgresql]
```

### 5. Test Connection

You can test the connection with:

```python
import asyncpg
import asyncio

async def test_connection():
    conn = await asyncpg.connect(
        user="cmd_user",
        password="your_secure_password",
        database="cmd_transparency",
        host="localhost"
    )
    version = await conn.fetchval('SELECT version()')
    print(f"Connected to: {version}")
    await conn.close()

asyncio.run(test_connection())
```

## Production Considerations

### For Docker Deployment:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cmd_transparency
      POSTGRES_USER: cmd_user
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    environment:
      DATABASE_URL: postgresql://cmd_user:secure_password_here@postgres:5432/cmd_transparency
    depends_on:
      - postgres
    ports:
      - "8000:8000"

volumes:
  postgres_data:
```

### For Cloud Deployment (AWS RDS, Google Cloud SQL, etc.):
```env
# Example for AWS RDS
DATABASE_URL=postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/cmd_transparency
ASYNC_DATABASE_URL=postgresql+asyncpg://username:password@your-rds-endpoint.amazonaws.com:5432/cmd_transparency
```

## Database Features with PostgreSQL

### Advantages over SQLite:
- **Concurrent Access**: Multiple users can access simultaneously
- **Better Performance**: Optimized for larger datasets
- **Advanced Features**: Full-text search, JSON queries, indexing
- **Scalability**: Can handle millions of records
- **ACID Compliance**: Better data integrity
- **Extensions**: PostGIS for geospatial data

### JSON Support:
PostgreSQL has excellent JSON support for our procurement_plan and location fields:

```sql
-- Query projects by ministry using JSON
SELECT * FROM projects WHERE procurement_plan->>'contractor_name' = 'Some Company';

-- Query by location
SELECT * FROM projects WHERE location->>'address' LIKE '%Kathmandu%';

-- Search in citizen reports
SELECT * FROM citizen_reports WHERE geolocation->>'lat' > '27.0';
```

## Backup and Maintenance

### Backup Database:
```bash
pg_dump -U cmd_user -h localhost cmd_transparency > backup.sql
```

### Restore Database:
```bash
psql -U cmd_user -h localhost cmd_transparency < backup.sql
```

### Monitor Performance:
```sql
-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname='public';

-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'cmd_transparency';
```