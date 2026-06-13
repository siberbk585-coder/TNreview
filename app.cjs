'use strict';
/**
 * Entry cho LiteSpeed lsnode / cPanel khi startup file là app.cjs (CommonJS).
 * Nạp server ESM thật (server.js).
 */
import('./server.js').catch((err) => {
  console.error(err);
  process.exit(1);
});
