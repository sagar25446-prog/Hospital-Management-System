const { pool } = require('./src/config/database');
pool.query("SELECT * FROM hospitals WHERE id = 'f0728b18-5e55-4ad4-bdbd-7fb7139c11e7'")
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => process.exit(0));
