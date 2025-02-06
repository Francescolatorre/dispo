const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function runExampleEmployees() {
  try {
    // Tabellen erstellen
    const createTableSql = fs.readFileSync(path.join(__dirname, 'create-employees-table.sql'), 'utf8');
    await pool.query(createTableSql);
    
    // Sicherstellen, dass die Tabelle erstellt wurde
    console.log('Tabelle erstellt');

    // Beispieldaten einfügen
    const insertDataSql = fs.readFileSync(path.join(__dirname, 'example-employees.sql'), 'utf8');
    await pool.query(insertDataSql);
    
    console.log('Beispieldaten erfolgreich importiert');
  } catch (error) {
    console.error('Fehler beim Importieren der Beispieldaten:', error);
  } finally {
    pool.end();
  }
}

runExampleEmployees();