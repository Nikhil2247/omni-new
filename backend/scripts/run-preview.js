// Launcher for the e-invite preview: transpile-only (fast, always reads fresh files) with a compiler option that
// works around the repo tsconfig's ignoreDeprecations value.
process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ ignoreDeprecations: '5.0' });
require('ts-node/register');
require('./preview-einvites.ts');
