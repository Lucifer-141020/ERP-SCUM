#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var css = fs.readFileSync(
  path.join(
    __dirname,
    '..',
    'frontend',
    'css',
    'main.css'
  ),
  'utf8'
);

var tests = [];
var passed = 0;
var failed = 0;

function test(name, fn) {
  tests.push({
    name: name,
    fn: fn
  });
}

function runTests() {
  console.log('TAP version 13');

  tests.forEach(function(item, index) {
    try {
      item.fn();
      passed += 1;

      console.log(
        'ok ' +
        (index + 1) +
        ' - ' +
        item.name
      );
    } catch (error) {
      failed += 1;

      console.log(
        'not ok ' +
        (index + 1) +
        ' - ' +
        item.name
      );

      console.log('  ---');
      console.log(
        '  message: ' +
        error.message
      );
      console.log('  ...');
    }
  });

  console.log('1..' + tests.length);
  console.log('# tests ' + tests.length);
  console.log('# pass ' + passed);

  if (failed > 0) {
    console.log('# fail ' + failed);
  }

  process.exit(
    failed > 0 ? 1 : 0
  );
}

var mobileStart =
  css.indexOf(
    '@media (max-width: 767px)'
  );

var landscapeStart =
  css.indexOf(
    '/* 横屏适配 */',
    mobileStart
  );

var mobileCss =
  mobileStart !== -1 &&
  landscapeStart !== -1
    ? css.substring(
        mobileStart,
        landscapeStart
      )
    : '';

// 查找同时包含 max-height: 450px 和 pointer: coarse 的横屏触控媒体查询
var landscapeTouchCss = '';
var searchPos = 0;

while (searchPos < css.length) {
  var mediaPos = css.indexOf('@media', searchPos);

  if (mediaPos === -1) {
    break;
  }

  var openBrace = css.indexOf('{', mediaPos);

  if (openBrace === -1) {
    break;
  }

  var condition = css.substring(mediaPos, openBrace);
  var hasMaxHeight =
    /max-height\s*:\s*450px/i.test(condition);
  var hasPointerCoarse =
    /pointer\s*:\s*coarse/i.test(condition);

  if (hasMaxHeight && hasPointerCoarse) {
    var depth = 1;
    var closeIdx = openBrace + 1;

    while (depth > 0 && closeIdx < css.length) {
      if (css[closeIdx] === '{') {
        depth += 1;
      } else if (css[closeIdx] === '}') {
        depth -= 1;
      }

      closeIdx += 1;
    }

    landscapeTouchCss = css.substring(
      openBrace,
      closeIdx
    );
    break;
  }

  searchPos = openBrace + 1;
}

test(
  '存在手机端响应式样式区',
  function() {
    if (!mobileCss) {
      throw new Error(
        '找不到 @media (max-width: 767px) 手机样式区'
      );
    }
  }
);

test(
  '手机菜单和主题按钮宽度为44px',
  function() {
    if (
      !/\.menu-btn\s*,\s*\.icon-btn\s*\{[\s\S]*?width\s*:\s*44px\s*;/.test(
        mobileCss
      )
    ) {
      throw new Error(
        '手机端 .menu-btn 和 .icon-btn 尚未设置 width: 44px'
      );
    }
  }
);

test(
  '手机菜单和主题按钮高度为44px',
  function() {
    if (
      !/\.menu-btn\s*,\s*\.icon-btn\s*\{[\s\S]*?height\s*:\s*44px\s*;/.test(
        mobileCss
      )
    ) {
      throw new Error(
        '手机端 .menu-btn 和 .icon-btn 尚未设置 height: 44px'
      );
    }
  }
);

test(
  '桌面端按钮仍保持38px规格',
  function() {
    if (
      !/\.icon-btn\s*,\s*\.menu-btn\s*\{[\s\S]*?width\s*:\s*38px\s*;[\s\S]*?height\s*:\s*38px\s*;/.test(
        css
      )
    ) {
      throw new Error(
        '桌面端38px按钮基础规格丢失'
      );
    }
  }
);

test(
  '存在横屏触控设备响应式样式区',
  function() {
    if (!landscapeTouchCss) {
      throw new Error(
        '找不到同时包含 max-height: 450px 和 pointer: coarse 的横屏触控媒体查询'
      );
    }
  }
);

test(
  '横屏触控设备菜单和主题按钮宽度为44px',
  function() {
    if (
      !/\.menu-btn\s*,\s*\.icon-btn\s*\{[\s\S]*?width\s*:\s*44px\s*;/.test(
        landscapeTouchCss
      )
    ) {
      throw new Error(
        '横屏触控设备 .menu-btn 和 .icon-btn 尚未设置 width: 44px'
      );
    }
  }
);

test(
  '横屏触控设备菜单和主题按钮高度为44px',
  function() {
    if (
      !/\.menu-btn\s*,\s*\.icon-btn\s*\{[\s\S]*?height\s*:\s*44px\s*;/.test(
        landscapeTouchCss
      )
    ) {
      throw new Error(
        '横屏触控设备 .menu-btn 和 .icon-btn 尚未设置 height: 44px'
      );
    }
  }
);

// 活动报名 CTA 横屏触控目标
test(
  '横屏触控设备活动报名CTA高度至少44px',
  function() {
    if (
      !/\.signup-cta\s*\{[\s\S]*?min-height\s*:\s*44px\s*;/.test(
        landscapeTouchCss
      )
    ) {
      throw new Error(
        '横屏触控 @media (max-height:450px) and (pointer:coarse) 内 .signup-cta 缺少 min-height:44px'
      );
    }
  }
);

test(
  '桌面基础CTA样式不应包含min-height:44px（确保修复限定在横屏媒体查询）',
  function() {
    // 在基础 .signup-cta 定义（非媒体查询内）查找 min-height
    // 取第一个非媒体查询内的 .signup-cta 块
    var baseCta = css.match(/(?:^|(?:\}))[^@]*?\.signup-cta\s*\{[^}]*\}/);
    // 如果找到基础定义块，确保不含 min-height:44px
    if (baseCta && baseCta[0].match(/min-height\s*:\s*44px/)) {
      throw new Error(
        '基础 .signup-cta 样式不应包含 min-height:44px（修复必须限定在横屏媒体查询）'
      );
    }
  }
);

runTests();
