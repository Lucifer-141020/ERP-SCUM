#!/usr/bin/env node
// Test script for homeStats and homeFeatures form rendering
// Uses jsdom to load the HTML and test the JavaScript functions
// Run: node scripts/test-card-forms.js  (from project root)

(function() {
  // --- Auto-setup: find jsdom ---
  var jsdomPath = null;
  var searchPaths = [
    require('path').join(__dirname, '..', 'node_modules', 'jsdom'),
    require('path').join(__dirname, 'node_modules', 'jsdom'),
    require('path').join(require('os').homedir(), '.workbuddy', 'binaries', 'node', 'workspace', 'node_modules', 'jsdom')
  ];
  for (var i = 0; i < searchPaths.length; i++) {
    try {
      require.resolve(searchPaths[i]);
      jsdomPath = searchPaths[i];
      break;
    } catch (e) { /* not found */ }
  }

  if (!jsdomPath) {
    console.error('[SETUP] jsdom not found. Installing...');
    var cp = require('child_process');
    var wsDir = require('path').join(require('os').homedir(), '.workbuddy', 'binaries', 'node', 'workspace');
    var result = cp.spawnSync(
      require('path').join(require('os').homedir(), '.workbuddy', 'binaries', 'node', 'versions', '22.22.2', 'npm.cmd'),
      ['install', 'jsdom'],
      { cwd: wsDir, stdio: 'inherit' }
    );
    if (result.status !== 0) {
      console.error('[SETUP] Failed to install jsdom. Run manually:');
      console.error('  cd ~/.workbuddy/binaries/node/workspace && npm install jsdom');
      process.exit(1);
    }
    jsdomPath = require('path').join(wsDir, 'node_modules', 'jsdom');
    console.log('[SETUP] jsdom installed successfully.\n');
  }

  var JSDOM = require(jsdomPath).JSDOM;

  // --- Main test ---
  var fs = require('fs');
  var path = require('path');

  var htmlPath = path.join(__dirname, '..', 'erp14-server-showcase.html');
  var html = fs.readFileSync(htmlPath, 'utf8');

  var dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://127.0.0.1:3000/',
    pretendToBeVisual: true
  });

  var window = dom.window;

  setTimeout(function() {
    try {
      var results = [];

      // Test 1: Check if functions exist on window
      var hasRenderHomeStatsFormList = typeof window.renderHomeStatsFormList === 'function';
      var hasRenderHomeFeaturesFormList = typeof window.renderHomeFeaturesFormList === 'function';
      var hasSyncHomeStatsForm = typeof window.syncHomeStatsForm === 'function';
      var hasSyncHomeFeaturesForm = typeof window.syncHomeFeaturesForm === 'function';
      var hasHomeCardColorOptions = typeof window.homeCardColorOptions === 'function';

      results.push({ test: 'renderHomeStatsFormList exists', pass: hasRenderHomeStatsFormList });
      results.push({ test: 'renderHomeFeaturesFormList exists', pass: hasRenderHomeFeaturesFormList });
      results.push({ test: 'syncHomeStatsForm exists', pass: hasSyncHomeStatsForm });
      results.push({ test: 'syncHomeFeaturesForm exists', pass: hasSyncHomeFeaturesForm });
      results.push({ test: 'homeCardColorOptions exists', pass: hasHomeCardColorOptions });

      // Test 2: Color options
      if (hasHomeCardColorOptions) {
        var options = window.homeCardColorOptions('blue');
        var hasBlue = options.indexOf('value="blue"') !== -1;
        var hasDefault = options.indexOf('value=""') !== -1;
        var hasAmber = options.indexOf('value="amber"') !== -1;
        var hasRed = options.indexOf('value="red"') !== -1;
        var hasInvalid = options.indexOf('value="brand"') !== -1 || options.indexOf('value="cool"') !== -1;
        results.push({
          test: 'Color options contain blue, default, amber, red only',
          pass: hasBlue && hasDefault && hasAmber && hasRed && !hasInvalid
        });

        var invalidOptions = window.homeCardColorOptions('brand');
        var defaultSelected = invalidOptions.indexOf('value="" selected') !== -1;
        var brandSelected = invalidOptions.indexOf('value="brand" selected') !== -1;
        results.push({
          test: 'Invalid color (brand) maps to default, not selected',
          pass: defaultSelected && !brandSelected
        });

        var coolOptions = window.homeCardColorOptions('cool');
        var coolDefaultSelected = coolOptions.indexOf('value="" selected') !== -1;
        var coolSelected = coolOptions.indexOf('value="cool" selected') !== -1;
        results.push({
          test: 'Invalid color (cool) maps to default, not selected',
          pass: coolDefaultSelected && !coolSelected
        });
      }

      // Test 3: renderHomeStatsFormList generates form fields
      if (hasRenderHomeStatsFormList) {
        var statsHtml = window.renderHomeStatsFormList();
        var hasStatIndex = statsHtml.indexOf('data-stat-index') !== -1;
        var hasStatIcon = statsHtml.indexOf('stat-icon') !== -1;
        var hasStatColor = statsHtml.indexOf('stat-color') !== -1;
        var hasStatLabel = statsHtml.indexOf('stat-label') !== -1;
        var hasStatValue = statsHtml.indexOf('stat-value') !== -1;
        var hasStatNote = statsHtml.indexOf('stat-note') !== -1;
        var hasMoveUp = statsHtml.indexOf('move-stat-up') !== -1;
        var hasMoveDown = statsHtml.indexOf('move-stat-down') !== -1;
        var hasDelete = statsHtml.indexOf('delete-stat') !== -1;
        var hasSelectColor = statsHtml.indexOf('<select class="stat-color"') !== -1;
        results.push({
          test: 'renderHomeStatsFormList has all form fields (icon, color, label, value, note)',
          pass: hasStatIndex && hasStatIcon && hasStatColor && hasStatLabel && hasStatValue && hasStatNote
        });
        results.push({
          test: 'renderHomeStatsFormList has move/delete buttons',
          pass: hasMoveUp && hasMoveDown && hasDelete
        });
        results.push({
          test: 'renderHomeStatsFormList uses <select> for color (dropdown, not text)',
          pass: hasSelectColor
        });
        var hasServerCapacity = statsHtml.indexOf('服务器容量') !== -1;
        var has128 = statsHtml.indexOf('128') !== -1;
        results.push({
          test: 'Old data (服务器容量, 128人) displays in form',
          pass: hasServerCapacity && has128
        });
      }

      // Test 4: renderHomeFeaturesFormList generates form fields
      if (hasRenderHomeFeaturesFormList) {
        var featuresHtml = window.renderHomeFeaturesFormList();
        results.push({
          test: 'renderHomeFeaturesFormList has all form fields (icon, color, title, text, tag1, tag2)',
          pass: featuresHtml.indexOf('data-feature-index') !== -1 &&
                featuresHtml.indexOf('feature-icon') !== -1 &&
                featuresHtml.indexOf('feature-color') !== -1 &&
                featuresHtml.indexOf('feature-title') !== -1 &&
                featuresHtml.indexOf('feature-text') !== -1 &&
                featuresHtml.indexOf('feature-tag1') !== -1 &&
                featuresHtml.indexOf('feature-tag2') !== -1
        });
        results.push({
          test: 'renderHomeFeaturesFormList has move/delete buttons',
          pass: featuresHtml.indexOf('move-feature-up') !== -1 &&
                featuresHtml.indexOf('move-feature-down') !== -1 &&
                featuresHtml.indexOf('delete-feature') !== -1
        });
        results.push({
          test: 'renderHomeFeaturesFormList uses <select> for color (dropdown, not text)',
          pass: featuresHtml.indexOf('<select class="feature-color"') !== -1
        });
        results.push({
          test: 'Old feature data (基地成长线) displays in form',
          pass: featuresHtml.indexOf('基地成长线') !== -1
        });
        results.push({
          test: 'Tags with 3+ items preserved (tag1=建家保护, tag2=区域规则,领地扩张)',
          pass: featuresHtml.indexOf('建家保护') !== -1 && featuresHtml.indexOf('区域规则,领地扩张') !== -1
        });
        results.push({
          test: 'Old data brand/cool colors NOT selected as brand/cool',
          pass: featuresHtml.indexOf('value="brand" selected') === -1 && featuresHtml.indexOf('value="cool" selected') === -1
        });
      }

      // Test 5: syncHomeStatsForm reads form values correctly
      if (hasRenderHomeStatsFormList && hasSyncHomeStatsForm) {
        var container = window.document.createElement('div');
        container.innerHTML = window.renderHomeStatsFormList();
        window.document.body.appendChild(container);

        var synced = window.syncHomeStatsForm();
        results.push({
          test: 'syncHomeStatsForm returns correct array with valid items',
          pass: Array.isArray(synced) && synced.length > 0 &&
                typeof synced[0].icon === 'string' && typeof synced[0].label === 'string'
        });
        results.push({
          test: 'syncHomeStatsForm only returns allowed colors',
          pass: synced.every(function(item) {
            return ['', 'blue', 'amber', 'red'].indexOf(item.color) !== -1;
          })
        });

        container.remove();
      }

      // Test 6: syncHomeFeaturesForm reads form values correctly
      if (hasRenderHomeFeaturesFormList && hasSyncHomeFeaturesForm) {
        var container2 = window.document.createElement('div');
        container2.innerHTML = window.renderHomeFeaturesFormList();
        window.document.body.appendChild(container2);

        var synced2 = window.syncHomeFeaturesForm();
        results.push({
          test: 'syncHomeFeaturesForm returns correct array with valid items',
          pass: Array.isArray(synced2) && synced2.length > 0 &&
                typeof synced2[0].title === 'string' && Array.isArray(synced2[0].tags)
        });

        // Check tags are correctly reconstructed
        if (synced2[0] && synced2[0].tags) {
          results.push({
            test: 'Tags correctly reconstructed (3 tags from tag1+tag2)',
            pass: synced2[0].tags.length === 3 &&
                  synced2[0].tags[0] === '建家保护' &&
                  synced2[0].tags[1] === '区域规则' &&
                  synced2[0].tags[2] === '领地扩张'
          });
        }

        results.push({
          test: 'syncHomeFeaturesForm only returns allowed colors',
          pass: synced2.every(function(item) {
            return ['', 'blue', 'amber', 'red'].indexOf(item.color) !== -1;
          })
        });

        container2.remove();
      }

      // Test 7: Empty icon defaults to 'shield'
      if (hasRenderHomeStatsFormList && hasSyncHomeStatsForm) {
        var container3 = window.document.createElement('div');
        container3.innerHTML = window.renderHomeStatsFormList();
        window.document.body.appendChild(container3);

        var firstIcon = container3.querySelector('[data-stat-index="0"] .stat-icon');
        if (firstIcon) firstIcon.value = '';

        var synced3 = window.syncHomeStatsForm();
        results.push({
          test: 'Empty icon defaults to shield',
          pass: synced3[0] && synced3[0].icon === 'shield'
        });

        container3.remove();
      }

      // Test 8: 大数字 validation
      if (hasRenderHomeStatsFormList && hasSyncHomeStatsForm) {
        var container4 = window.document.createElement('div');
        container4.innerHTML = window.renderHomeStatsFormList();
        window.document.body.appendChild(container4);

        // Clear the first stat's 大数字
        var firstValue = container4.querySelector('[data-stat-index="0"] .stat-value');
        if (firstValue) firstValue.value = '';

        var synced4 = window.syncHomeStatsForm();
        results.push({
          test: 'Empty 大数字 (value) returns empty string',
          pass: synced4[0] && synced4[0].value === ''
        });
        results.push({
          test: 'Empty 大数字 triggers validation (!item.value)',
          pass: synced4[0] && !synced4[0].value
        });

        container4.remove();
      }

      // Print results
      console.log('\n=== FORM CARD TEST RESULTS ===\n');
      var passed = 0, failed = 0;
      results.forEach(function(r, i) {
        var status = r.pass ? 'PASS' : 'FAIL';
        console.log((i + 1) + '. [' + status + '] ' + r.test);
        if (r.pass) passed++; else failed++;
      });
      console.log('\nTotal: ' + results.length + ', Passed: ' + passed + ', Failed: ' + failed);
      console.log('');

      if (failed > 0) {
        console.log('=== SOME TESTS FAILED ===');
        process.exit(1);
      } else {
        console.log('=== ALL TESTS PASSED ===');
        process.exit(0);
      }
    } catch (err) {
      console.error('Test error:', err.message);
      console.error(err.stack);
      process.exit(1);
    }
  }, 5000);
})();
