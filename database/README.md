# Setup de Base de Datos MySQL

## 1. Instalar MySQL

Si no tienes MySQL instalado:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# macOS (con Homebrew)
brew install mysql
brew services start mysql

# Windows
# Descarga el instalador desde: https://dev.mysql.com/downloads/mysql/
```

## 2. Iniciar MySQL

```bash
# Ubuntu/Debian/macOS
sudo mysql

# O si configuraste contraseña:
mysql -u root -p
```

## 3. Crear la base de datos

```sql
CREATE DATABASE skillpilot_mvp;
USE skillpilot_mvp;
```

## 4. Importar el schema

Desde la terminal de tu sistema (NO dentro de MySQL):

```bash
mysql -u root -p skillpilot_mvp < database/schema.sql
```

O desde dentro de MySQL:

```sql
USE skillpilot_mvp;
SOURCE database/schema.sql;
```

## 5. Verificar las tablas

```sql
SHOW TABLES;
DESCRIBE users;
DESCRIBE sessions;
DESCRIBE user_progress;
```

## 6. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de MySQL:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=skillpilot_mvp
JWT_SECRET=genera_uno_aleatorio
GROQ_API_KEY=tu_api_key
```

Para generar un JWT_SECRET seguro:

```bash
openssl rand -base64 32
```

## 7. Instalar dependencias y ejecutar

```bash
npm install
npm run dev
```

## Solución de problemas comunes

### Error: "Access denied for user 'root'@'localhost'"

```sql
-- Cambiar contraseña de root
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'nueva_contraseña';
FLUSH PRIVILEGES;
```

### Error: "Can't connect to MySQL server"

```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql  # Linux
brew services list           # macOS

# Iniciar MySQL si está detenido
sudo systemctl start mysql   # Linux
brew services start mysql    # macOS
```

### Crear usuario específico (recomendado para producción)

```sql
CREATE USER 'skillpilot'@'localhost' IDENTIFIED BY 'password_seguro';
GRANT ALL PRIVILEGES ON skillpilot_mvp.* TO 'skillpilot'@'localhost';
FLUSH PRIVILEGES;
```

Luego actualiza el `.env`:

```
DB_USER=skillpilot
DB_PASSWORD=password_seguro
```
