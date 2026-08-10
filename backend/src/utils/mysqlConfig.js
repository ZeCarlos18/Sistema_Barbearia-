const fs = require('fs');

function isEnabled(value) {
  return String(value).toLowerCase() === 'true';
}

function getSslCa() {
  if (process.env.DB_SSL_CA_PATH) {
    return fs.readFileSync(process.env.DB_SSL_CA_PATH, 'utf8');
  }

  if (process.env.DB_SSL_CA) {
    return process.env.DB_SSL_CA.replace(/\\n/g, '\n');
  }

  return null;
}

function buildMysqlConfig({ database } = {}) {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
  };

  if (database) {
    config.database = database;
  }

  if (isEnabled(process.env.DB_SSL)) {
    const ca = getSslCa();
    config.ssl = ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true };
  }

  return config;
}

module.exports = {
  buildMysqlConfig,
};