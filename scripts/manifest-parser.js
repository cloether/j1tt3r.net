/**
 * Manifest Parser
 *
 * @link https://github.com/mounirlamouri/manifest-validator/blob/master/static/manifest-parser.js
 */
const ManifestParser = (function () {
  'use strict';

  let _jsonInput = {};
  let _manifest = {};

  let _logs = [];
  let _tips = [];

  let _success = true;

  const ALLOWED_DISPLAY_VALUES = [
    'fullscreen',
    'standalone',
    'minimal-ui',
    'browser'
  ];

  const ALLOWED_ORIENTATION_VALUES = [
    'any',
    'natural',
    'landscape',
    'portrait',
    'portrait-primary',
    'portrait-secondary',
    'landscape-primary',
    'landscape-secondary'
  ];

  const ALLOWED_DIR_VALUES = [
    'ltr',
    'rtl',
    'auto'
  ];

  function _parseString(args) {
    let object = args.object;
    let property = args.property;
    if (!(property in object)) {
      return undefined;
    }
    if (typeof object[property] != 'string') {
      _logs.push(`ERROR: '${property}' expected to be a string but is not.`);
      return undefined;
    }
    if (args.trim) {
      return object[property].trim();
    }
    return object[property];
  }

  function _parseBoolean(args) {
    let object = args.object;
    let property = args.property;
    let defaultValue = args.defaultValue;
    if (!(property in object)) {
      return defaultValue;
    }
    if (typeof object[property] != 'boolean') {
      _logs.push(`ERROR: '${property}' expected to be a boolean but is not.`);
      return defaultValue;
    }
    return object[property];
  }

  function _parseURL(args) {
    let object = args.object;
    let property = args.property;
    // noinspection JSUnusedLocalSymbols
    let baseURL = args.baseURL;
    let str = _parseString({object: object, property: property, trim: false});
    if (str === undefined) {
      return undefined;
    }
    // TODO: resolve url using baseURL
    // new URL(object[property], baseURL);
    return object[property];
  }

  function _parseColor(args) {
    let object = args.object;
    let property = args.property;
    if (!(property in object)) {
      return undefined;
    }
    if (typeof object[property] != 'string') {
      _logs.push(`ERROR: '${property}' expected to be a string but is not.`);
      return undefined;
    }
    // If style.color changes when set to the given color, it is valid. Testing
    // against 'white' and 'black' in case of the given color is one of them.
    let dummy = document.createElement('div');
    dummy.style.color = 'white';
    dummy.style.color = object[property];
    if (dummy.style.color !== 'white') {
      return object[property];
    }
    dummy.style.color = 'black';
    dummy.style.color = object[property];
    if (dummy.style.color !== 'black') {
      return object[property];
    }
    return undefined;
  }

  function _parseName() {
    return _parseString({object: _jsonInput, property: 'name', trim: true});
  }

  function _parseShortName() {
    return _parseString({
      object: _jsonInput,
      property: 'short_name',
      trim: true
    });
  }

  function _parseStartUrl() {
    // TODO: parse url using manifest_url as a base (missing).
    return _parseURL({object: _jsonInput, property: 'start_url'});
  }

  function _parseDisplay() {
    let display = _parseString({
      object: _jsonInput,
      property: 'display',
      trim: true
    });
    if (display === undefined) {
      return display;
    }
    if (ALLOWED_DISPLAY_VALUES.indexOf(display.toLowerCase()) === -1) {
      _logs.push('ERROR: \'display\' has an invalid value, will be ignored.');
      return undefined;
    }
    return display;
  }

  function _parseOrientation() {
    let orientation = _parseString({
      object: _jsonInput,
      property: 'orientation',
      trim: true
    });
    if (orientation === undefined) {
      return orientation;
    }
    if (ALLOWED_ORIENTATION_VALUES.indexOf(orientation.toLowerCase()) === -1) {
      _logs.push('ERROR: \'orientation\' has an invalid value, ' +
          'will be ignored.');
      return undefined;
    }
    return orientation;
  }

  function _parseIcons() {
    let property = 'icons';
    let icons = [];
    if (!(property in _jsonInput)) {
      return icons;
    }
    if (!Array.isArray(_jsonInput[property])) {
      _logs.push(`ERROR: '${property}' expected to be an array but is not.`);
      return icons;
    }
    _jsonInput[property].forEach(function (object) {
      let icon = {};
      if (!('src' in object)) {
        return;
      }
      // TODO: pass manifest url as base.
      icon.src = _parseURL({object: object, property: 'src'});
      icon.type = _parseString({
        object: object,
        property: 'type',
        trim: true
      });
      icon.density = parseFloat(object.density);
      if (isNaN(icon.density) || !isFinite(icon.density) || icon.density <= 0) {
        icon.density = 1.0;
      }
      if ('sizes' in object) {
        let set = new Set();
        let link = document.createElement('link');
        link.sizes = object.sizes;
        for (let i = 0; i < link.sizes.length; ++i) {
          set.add(link.sizes.item(i).toLowerCase());
        }
        if (set.size !== 0) {
          icon.sizes = set;
        }
      }
      icons.push(icon);
    });
    return icons;
  }

  function _parseRelatedApplications() {
    let property = 'related_applications';
    let applications = [];
    if (!(property in _jsonInput)) {
      return applications;
    }
    if (!Array.isArray(_jsonInput[property])) {
      _logs.push(`ERROR: '${property}' expected to be an array but is not.`);
      return applications;
    }
    _jsonInput[property].forEach(function (object) {
      let application = {};
      application.platform = _parseString({
        object: object,
        property: 'platform',
        trim: true
      });
      application.id = _parseString({
        object: object,
        property: 'id',
        trim: true
      });
      // TODO: pass manifest url as base.
      application.url = _parseURL({object: object, property: 'url'});
      applications.push(application);
    });
    return applications;
  }

  function _parsePreferRelatedApplications() {
    return _parseBoolean({
      object: _jsonInput,
      property: 'prefer_related_applications',
      defaultValue: false
    });
  }

  function _parseThemeColor() {
    return _parseColor({object: _jsonInput, property: 'theme_color'});
  }

  function _parseBackgroundColor() {
    return _parseColor({object: _jsonInput, property: 'background_color'});
  }

  function _parseDir() {
    let dir = _parseString({object: _jsonInput, property: 'dir', trim: true});
    if (dir === undefined) {
      return 'auto';
    }
    if (ALLOWED_DIR_VALUES.indexOf(dir) === -1) {
      _logs.push('ERROR: \'dir\' has an invalid value, ' +
          'so will default to "auto"');
      return 'auto';
    }
    return dir;
  }

  function _parse(string) {
    // TODO: temporary while ManifestParser is a collection of static methods.
    _logs = [];
    _tips = [];

    _success = true;
    try {
      _jsonInput = JSON.parse(string);
    } catch (e) {
      _logs.push('File isn\'t valid JSON: ' + e);
      _tips.push('Your JSON failed to parse, these are the main reasons why ' +
          'JSON parsing usually fails:\n' +
          '- Double quotes should be used around property names and for ' +
          'strings. Single quotes are not valid.\n' +
          '- JSON specification disallow trailing comma after the last ' +
          'property even if some implementations allow it.');
      _success = false;
      return;
    }

    _logs.push('JSON parsed successfully.');

    _manifest.dir = _parseDir();
    _manifest.name = _parseName();
    //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    _manifest.short_name = _parseShortName();
    _manifest.start_url = _parseStartUrl();
    _manifest.display = _parseDisplay();
    _manifest.orientation = _parseOrientation();
    _manifest.icons = _parseIcons();
    _manifest.related_applications = _parseRelatedApplications();
    _manifest.prefer_related_applications = _parsePreferRelatedApplications();
    _manifest.theme_color = _parseThemeColor();
    _manifest.background_color = _parseBackgroundColor();

    _logs.push(`Parsed \`name\` property is: ${_manifest.name}`);
    _logs.push(`Parsed \`short_name\` property is: ${_manifest.short_name}`);
    _logs.push(`Parsed \`start_url\` property is: ${_manifest.start_url}`);
    _logs.push(`Parsed \`display\` property is: ${_manifest.display}`);
    _logs.push(`Parsed \`orientation\` property is: ${_manifest.orientation}`);
    _logs.push(`Parsed \`icons\` property is: ${JSON.stringify(_manifest.icons, null, 4)}`);
    _logs.push(`Parsed \`related_applications\` property is: ${JSON.stringify(_manifest.related_applications, null, 4)}`);
    _logs.push(`Parsed \`prefer_related_applications\` property is: ${JSON.stringify(_manifest.prefer_related_applications, null, 4)}`);
    _logs.push(`Parsed \`theme_color\` property is: ${_manifest.theme_color}`);
    _logs.push(`Parsed \`background_color\` property is: ${_manifest.background_color}`);
    //jscs:enable
  }

  // noinspection JSUnusedGlobalSymbols
  return {
    parse: _parse,
    manifest: function () {
      return _manifest;
    },
    logs: function () {
      return _logs;
    },
    tips: function () {
      return _tips;
    },
    success: function () {
      return _success;
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  const jsdom = require('jsdom');
  // noinspection JSValidateTypes
  document = new jsdom.JSDOM('<DOCTYPE html>');
  module.exports = ManifestParser;
}
