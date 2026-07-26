const { sql } = require('./src/config/database');
async function test() {
  const query = "SELECT name FROM hospitals WHERE name ILIKE $1 OR SIMILARITY(name, $1) > 0.2";
  try {
    const res = await sql.query(query, ['%AIIMS%']);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  }
}
test();
