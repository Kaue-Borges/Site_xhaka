import mysql from "mysql2/promise";

export function createPool(config) {
  return mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 50,
    dateStrings: true,
    timezone: "Z",
    decimalNumbers: true,
  });
}
