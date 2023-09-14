const validate = require('web-app-manifest-validator');
const manifest = require('../src/manifest.json');

validate(manifest).forEach(console.error);
