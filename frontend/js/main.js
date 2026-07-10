    const icons = {
      menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
      sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></svg>',
      signal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h.01M7 20a5 5 0 0 0-5-5M12 20A10 10 0 0 0 2 10M17 20A15 15 0 0 0 2 5"/></svg>',
      map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
      message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/></svg>',
      shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16.5 9.4-9-5.2"/><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 22V12"/></svg>',
      flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A4.5 4.5 0 1 0 16 11c0-4-4-6-4-9-3 2-5 5-5 9a5 5 0 0 0 1.5 3.5z"/></svg>',
      bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/></svg>',
      crosshair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M22 12h-4M6 12H2M12 2v4M12 18v4"/></svg>',
      package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="M21 16V8l-9-5-9 5v8l9 5z"/></svg>',
      clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/></svg>',
      gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8S10 2 7 4s3 4 5 4zM12 8s2-6 5-4-3 4-5 4z"/></svg>',
      chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M9 10h6M9 13h3"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
      lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
    };

    let heroImages = [
      'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=80'
    ];

    let serverInfo = {
      title: 'Erp 14',
      season: '赛季进行中 · 长期稳定开放',
      description: '一个面向长期玩家的 SCUM 生存服务器。这里强调公平、合作、探索、基地建设和有节奏的活动，让新手能站稳，老玩家有目标。',
      no: 'Erp 14-A',
      ip: '127.0.0.1:7777',
      group: '123456789',
      joinText: '加入玩家群',
      joinUrl: 'https://qm.qq.com/q/mJgyxzi2YM',
      joinQr: '',
      joinApplication: '申请加入时请备注你的 SCUM 游戏内名称。'
    };

    let playItems = [
      {
        key: 'recycle',
        icon: 'package',
        title: '回收',
        subtitle: '把无用物资转化为服务器经济资源',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=80',
        images: ['https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=80'],
        text: '回收系统用于处理玩家多余物资。玩家可以把指定物品带到回收点，换取金币、积分或活动兑换材料，让探索和拾荒都有明确收益。',
        points: ['支持按物品类型设置不同回收价格', '可用于活动积分、商城币或服务器货币', '适合鼓励玩家清理仓库和参与探索']
      },
      {
        key: 'title',
        icon: 'shield',
        title: '称号',
        subtitle: '展示玩家身份、成就和社区贡献',
        image: 'https://images.unsplash.com/photo-1520975682031-ae3f8d4f596b?auto=format&fit=crop&w=1200&q=80',
        images: ['https://images.unsplash.com/photo-1520975682031-ae3f8d4f596b?auto=format&fit=crop&w=1200&q=80'],
        text: '称号系统让玩家在社区里拥有可见身份。称号可以来自赛季排行、活动胜利、基地评选、贡献奖励或管理员授予。',
        points: ['可区分新手、老玩家、VIP、活动冠军等身份', '适合做赛季荣誉和社区展示', '后续可接入玩家中心自动展示']
      },
      {
        key: 'intro',
        icon: 'home',
        title: '服务器介绍',
        subtitle: '让新玩家快速理解 Erp 14 的定位',
        image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
        images: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80'],
        text: 'Erp 14 是偏长期经营的 SCUM 服务器，重点是稳定规则、基地成长、适中物资和有节奏的活动。这里适合喜欢经营、探索和团队协作的玩家。',
        points: ['长期开放，规则稳定', '适合新手入门和老玩家经营', '玩法说明会持续在网站更新']
      },
      {
        key: 'economy',
        icon: 'box',
        title: '经济系统',
        subtitle: '围绕物资、交易和活动奖励建立循环',
        image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
        images: ['https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80'],
        text: '经济系统会把回收、任务、活动、交易区和玩家服务串起来，避免单纯刷物资导致目标感不足。',
        points: ['交易区支持玩家之间交换资源', '活动奖励可进入经济循环', '未来可扩展商城、卡密和兑换系统']
      },
      {
        key: 'events',
        icon: 'flame',
        title: '活动玩法',
        subtitle: '周末空投、车队护送、基地评选',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'],
        text: '活动玩法负责给服务器制造节奏。管理员可以围绕地图点位、时间窗口和奖励池组织不同活动。',
        points: ['周末空投争夺和限时 Boss 点', '车队护送、寻宝、基地评选', '每周活动公告会在每周活动页展示']
      },
      {
        key: 'rules',
        icon: 'crosshair',
        title: 'PVP 与规则',
        subtitle: '保留对抗，但减少无意义争议',
        image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
        images: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80'],
        text: 'PVP 会集中在明确区域和活动目标中展开。普通区域强调长期建设和社区秩序，避免无规则恶意破坏。',
        points: ['活动区允许对抗，普通区遵守服务器规则', '突袭时间和限制明确公示', '管理员保留日志审查和处罚权']
      }
    ];

    let requests = [
      { status: 'pending', category: '新玩法/活动', contact: 'QQ 已登记', images: [], title: '增加周末车队护送活动', user: 'Lucifer', text: '希望每周固定一次护送活动，路线提前公布，劫车和护送双方都有奖励。', agree: 12, disagree: 1, adminReply: '', rejectReason: '' },
      { status: 'planned', category: '优化', contact: 'QQ 已登记', images: [], title: '开放新手补给领取', user: '若云', text: '建议新玩家第一次进入服务器可以领取基础工具、食物和小背包。', agree: 19, disagree: 0, adminReply: '已进入计划，准备和新手礼包一起调整。', rejectReason: '' },
      { status: 'done', category: '优化', contact: 'QQ 已登记', images: [], title: '优化交易区公告', user: '小颜', text: '交易规则已经整理到网站首页，后续会加入更详细的商品分类说明。', agree: 8, disagree: 0, adminReply: '已完成，后续继续补充商品分类。', rejectReason: '' },
      { status: 'done', category: '优化', contact: 'QQ 已登记', images: [], title: '新增新手基地模板', user: '北风', text: '已加入适合新玩家购买的紧凑型基地模板，降低前期开荒建造成本。', agree: 15, disagree: 1, adminReply: '', rejectReason: '' },
      { status: 'done', category: '优化', contact: 'Discord 已登记', images: [], title: '调整活动奖励说明', user: 'Mint', text: '活动奖励已经改为提前公示，玩家可以在活动前确认参与目标和领取规则。', agree: 11, disagree: 0, adminReply: '', rejectReason: '' },
      { status: 'rejected', category: 'BUG', contact: 'QQ 已登记', images: [], title: '示例：无法复现的问题', user: '玩家示例', text: '这是一个已拒绝建议示例，用于展示管理员拒绝原因。', agree: 1, disagree: 0, adminReply: '', rejectReason: '信息不足，暂时无法复现，请补充截图或具体位置。' }
    ];

    let buildingTemplates = [
      { title: '新手安全屋', price: '8,000 金币', image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80', images: ['https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80'], description: '适合 1-2 人开荒使用，结构紧凑，维护成本低，包含基础储物和简易防御空间。', note: '备注：可按地形微调入口方向。', onShelf: true, stock: '不限', limit: '每人限购 1 套', buyUrl: '#' },
      { title: '双人进阶基地', price: '18,000 金币', image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80', images: ['https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80'], description: '适合双人长期居住，预留车辆停放区、工作台区和独立物资间。', note: '备注：建议配合中级维护包。', onShelf: true, stock: '5 套', limit: '每队限购 1 套', buyUrl: '#' },
      { title: '小队防御堡垒', price: '36,000 金币', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', images: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80'], description: '适合 3-5 人小队，强调视野、分区和防御动线，适合活动据点或长期基地。', note: '备注：购买前需确认服务器建造区域规则。', onShelf: true, stock: '3 套', limit: '每队限购 1 套', buyUrl: '#' }
    ];

    let updates = [
      { id: 'weekend-airdrop', activityType: 'signup', version: '活动 06.19', status: '已发布', title: '周末空投争夺开启', text: '周六 20:30 开启空投争夺，活动区内允许 PVP，结束后统一发放参与奖励。', published: true, signupEnabled: true, signupDeadline: '2026-12-31T20:00', eventEndAt: '2026-12-31T23:00' },
      { id: 'newbie-protection', activityType: 'fixed', version: '规则更新', status: '已生效', title: '新手保护范围调整', text: '新玩家保护期内禁止恶意蹲守出生点，违规行为将记录并处罚。', published: true, signupEnabled: false, signupDeadline: '', eventEndAt: '' },
      { id: 'trade-zone-update', activityType: 'fixed', version: '内容更新', status: '已发布', title: '交易区展示页整理', text: '网站新增交易区、基地经营和活动玩法说明，方便玩家入服前了解规则。', published: true, signupEnabled: false, signupDeadline: '', eventEndAt: '' },
      { id: 'base-contest', activityType: 'signup', version: '活动预告', status: '已发布', title: '基地评选活动', text: '开放基地投稿和投票，优秀作品会展示在网站首页。', published: true, signupEnabled: true, signupDeadline: '2026-12-31T21:00', eventEndAt: '2027-01-01T00:00' }
    ];

    let siteSections = {
      homeStats: { label: '首页数据栏', visible: true, order: 10 },
      homeFeatures: { label: '首页特色', visible: true, order: 20 },
      homeRules: { label: '服务器注意事项', visible: true, order: 30 },
      play: { label: '玩法页面', visible: true, order: 40 },
      homeSuggestions: { label: '首页玩家建议', visible: true, order: 40 },
      buildingTemplates: { label: '建筑模板展示', visible: true, order: 45 },
      requests: { label: '玩家建议页面', visible: true, order: 50 },
      events: { label: '每周活动页面', visible: true, order: 60 }
    };

    let homeStats = [
      { icon: 'users', color: '', label: '服务器容量', value: '128 人', note: '中大型SCUM游戏社区' },
      { icon: 'shield', color: 'blue', label: '运营规则', value: '公平', note: '商城可开' },
      { icon: 'box', color: 'amber', label: '物资节奏', value: '微硬核', note: '避免过快毕业' },
      { icon: 'flame', color: 'red', label: '活动玩法', value: '每周', note: 'PVE / 黑市 / 空投' }
    ];

    let homeFeatures = {
      title: '服务器特色',
      description: '玩家打开网站时可以快速理解 Erp 14 的定位、规则和游玩目标。',
      items: [
        { icon: 'home', color: '', title: '基地成长线', text: '鼓励建家、囤物、维护和贸易，基地不是一次性消耗品，而是玩家长期经营的核心。通过升级建筑等级、拓展领地范围，你可以打造属于自己的生存堡垒。', tags: ['建家保护', '区域规则', '领地扩张'] },
        { icon: 'crosshair', color: 'blue', title: '可控 PVP', text: '保留刺激的对抗，但通过规则和活动分区降低恶意碾压，让战斗更有目标。周中和周末开放不同的活动战区，让喜欢PVP的玩家有地方打，喜欢PVE的玩家有空间活。', tags: ['活动战区', '公平约束', 'PVP/PVE分区'] },
        { icon: 'package', color: 'amber', title: '经济与交易', text: '玩家可以围绕物资、载具、服务和活动奖励形成交易关系，服务器更像一个小社区。支持以物易物、金币交易和委托任务，打造有温度的玩家经济圈。', tags: ['交易区', '活动奖励', '委托任务'] },
        { icon: 'clock', color: 'red', title: '定期活动', text: '围绕空投、Boss 点、车队护送和寻宝设计节奏，让周末有明确目标。每周五发布活动预告，周六日组织活动，让服务器每个周末都有新期待。', tags: ['周末活动', '限时目标', '活动预告'] },
        { icon: 'shield', color: 'brand', title: '公平竞技', text: '服务器始终维护公平竞技环境，对违规行为零容忍，并接受玩家监督和举报。管理团队7x24小时在线处理争议，确保每位玩家都能享受公平的生存体验。', tags: ['零容忍', '在线管理', '举报机制'] },
        { icon: 'users', color: 'cool', title: '新手友好', text: '新玩家入服享有多项保护福利——新手保护期、基础物资补给、专属咨询服务。还有老玩家自愿担任向导，帮助你快速上手SCUM的生存技巧。', tags: ['新手保护', '物资补给', '向导服务'] }
      ]
    };

    let serverRules = {
      title: '服务器注意事项',
      description: '入服前建议先看完这些规则，避免误会和违规。',
      image: '',
      items: [
        { title: '尊重新手保护', text: '新玩家保护期内禁止恶意蹲守出生点、反复击杀或诱导违规。新手保护期持续48小时，期间击杀新手将触发自动记录。', level: '重要' },
        { title: '活动区规则优先', text: '活动区开放对抗时按每周活动公告执行，普通区域仍遵守日常服务器规则。请关注每周五发布的活动预告。', level: '活动' },
        { title: '禁止恶意破坏体验', text: '外挂、漏洞利用、辱骂刷屏、恶意卡服等行为会被记录并处理。管理团队定期巡逻，同时接受玩家举报。', level: '底线' },
        { title: '基地保护规则', text: '服务器开启基地保护机制，未活跃玩家基地有一定免疫期。连续7天未登录的基地将进入保护状态。', level: '提示' },
        { title: '资源采集平衡', text: '为保障所有玩家公平获取资源，服务器设置了资源刷新倍率和限制。严禁垄断公共资源点。', level: '提示' },
        { title: '语言与礼仪', text: '公频交流请使用中文或英文，避免使用侮辱性语言。尊重每一位玩家，维护服务器良好氛围。', level: '建议' }
      ]
    };

    function getDefaultApiBaseUrl() {
      const { protocol, hostname, origin } = window.location;
      const isLocalHost = hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '';
      if (protocol === 'file:' || isLocalHost) return 'http://127.0.0.1:3000';
      return origin;
    }

    const API_BASE_URL = (window.ERP14_API_BASE_URL || getDefaultApiBaseUrl()).replace(/\/$/, '');
    const PUBLIC_CONFIG_URL = `${API_BASE_URL}/api/config`;
    const HERO_URL = `${API_BASE_URL}/api/hero`;
    const PLAYS_URL = `${API_BASE_URL}/api/plays`;
    const EVENTS_URL = `${API_BASE_URL}/api/events`;
    const SIGNUPS_URL = `${API_BASE_URL}/api/signups`;
    const ADMIN_TOKEN_KEY = 'erp14-admin-token';
    let adminToken = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
    let backendSaveTimer = null;
    let contentOverrides = [];
    let pendingRequestImages = [];
    let eventSignupCounts = {};
    let eventSignupDetails = {};
    let activeSignupEventId = '';
    let imageViewerGallery = [];
    let imageViewerIndex = 0;
    let imageLibrary = [];
    let requestVotes = {};
    let adminRequestFilter = 'all';
    let panelDirty = false;
    let activeRequestStatus = '';
    let activePlayerName = '';
    let playerSessions = [];
    let expandedFixed = false;
    let expandedSignup = false;
    const ACTIVITY_PREVIEW_COUNT = 2;
    let logs = [
      { title: '13:58 每周活动公告更新', text: '周末空投活动发布时间变更', tag: '公告', tagClass: 'blue' },
      { title: '12:10 网站数据准备完成', text: '后台管理已支持编辑玩法、活动和建议。', tag: '系统', tagClass: '' }
    ];

    function renderOverviewDetails() {
      const pendingRequests = requests.filter(item => normalizeRequestStatus(item.status) === 'pending').slice(0, 5);
      const signupEvents = updates.filter(item => inferActivityType(item) === 'signup' && isSignupVisible(item)).slice(0, 5);
      const recentSignupRows = Object.entries(eventSignupDetails || {}).flatMap(([eventId, items]) =>
        (Array.isArray(items) ? items : []).map(item => ({
          eventId,
          name: item.playerName || item.player_name || item.name || '未填写名称',
          note: item.note || '',
          createdAt: item.createdAt || item.created_at || item.time || ''
        }))
      ).slice(0, 5);
      const latestLogs = logs.slice(0, 5);
      const imageCount = imageLibrary.length;

      return `
        <div class="overview-detail-grid">
          <section class="card pad overview-detail-card">
            <div class="panel-title"><h3>待处理玩家建议</h3><p>只显示最近 5 条，完整处理请进入“玩家建议”。</p></div>
            ${pendingRequests.length ? pendingRequests.map(item => `<div class="panel-row"><div><strong>${escapeHtml(item.title || '未命名建议')}</strong><p class="muted">${escapeHtml(item.user || item.contact || '玩家')} · ${requestCategoryLabel(item.category)}</p></div><span class="tag blue">${requestLabel(item.status)}</span></div>`).join('') : '<div class="panel-row"><div><strong>暂无待处理建议</strong><p class="muted">当前没有需要马上处理的玩家建议。</p></div><span class="tag green">正常</span></div>'}
          </section>
          <section class="card pad overview-detail-card">
            <div class="panel-title"><h3>正在报名的活动</h3><p>只读显示已发布且未过期的限时活动。</p></div>
            ${signupEvents.length ? signupEvents.map(item => `<div class="panel-row"><div><strong>${escapeHtml(item.title || '未命名活动')}</strong><p class="muted">截止：${escapeHtml(formatDateText(item.signupDeadline))}</p></div><span class="tag green">报名中</span></div>`).join('') : '<div class="panel-row"><div><strong>暂无报名中活动</strong><p class="muted">可在“活动管理”里开启限时活动报名。</p></div><span class="tag">空</span></div>'}
          </section>
          <section class="card pad overview-detail-card">
            <div class="panel-title"><h3>最近报名</h3><p>展示当前浏览器已加载到的报名信息。</p></div>
            ${recentSignupRows.length ? recentSignupRows.map(item => `<div class="panel-row"><div><strong>${escapeHtml(item.name)}</strong><p class="muted">${escapeHtml(item.note || '无备注')} ${item.createdAt ? '· ' + escapeHtml(item.createdAt) : ''}</p></div><span class="tag blue">报名</span></div>`).join('') : '<div class="panel-row"><div><strong>暂无可显示报名</strong><p class="muted">进入活动详情或刷新报名数据后会显示。</p></div><span class="tag">只读</span></div>'}
          </section>
          <section class="card pad overview-detail-card">
            <div class="panel-title"><h3>图片库状态</h3><p>这里只看数量，上传和删除请进入“图片库”。</p></div>
            <div class="panel-row"><div><strong>${imageCount} 张图片</strong><p class="muted">当前本地已加载的图片库记录。</p></div><span class="tag blue">图片</span></div>
          </section>
          <section class="card pad overview-detail-card">
            <div class="panel-title"><h3>最近备份状态</h3><p>后台不会自动覆盖数据，导入或重置前请先导出备份。</p></div>
            <div class="panel-row"><div><strong>请使用“备份恢复”手动导出</strong><p class="muted">本总览只做提醒，不会自动写入或恢复数据。</p></div><span class="tag amber">注意</span></div>
          </section>
          <section class="card pad overview-detail-card">
            <div class="panel-title"><h3>最近操作日志</h3><p>只显示前 5 条，完整筛选请进入“操作日志”。</p></div>
            ${latestLogs.length ? latestLogs.map(item => `<div class="panel-row"><div><strong>${escapeHtml(item.title || '操作记录')}</strong><p class="muted">${escapeHtml(item.text || '')}</p></div><span class="tag ${escapeAttr(item.tagClass || '')}">${escapeHtml(item.tag || '日志')}</span></div>`).join('') : '<div class="panel-row"><div><strong>暂无操作日志</strong><p class="muted">完成后台操作后会出现记录。</p></div><span class="tag">空</span></div>'}
          </section>
        </div>`;
    }

    let panelViews = {
      adminLogin: () => `
        <div class="login-wrap">
          <div class="login-art card">
            <div>
              <span class="eyebrow"><span data-icon="lock"></span> 管理员入口</span>
              <h2>管理员登录</h2>
              <p>这里是服主和管理员进入管理功能的入口。登录后会把后台保存和图片上传同步到本地后端。</p>
            </div>
          </div>
          <div class="card pad">
            <div class="section-head" style="margin-top:0">
              <div>
                <h2>管理员登录</h2>
                <p>用于进入管理后台，不面向普通玩家。</p>
              </div>
            </div>
            <form class="form" id="adminLoginForm">
              <label>管理员账号<input id="adminUser" placeholder="请输入管理员账号"></label>
              <label>管理员密码<input id="adminPass" type="password" placeholder="请输入管理员密码"></label>
              <button class="btn-primary" type="submit">进入管理</button>
            </form>
          </div>
        </div>`,
      overview: () => `
        <div class="panel-title">
          <h3>运营总览</h3>
          <p>只读查看当前后台重点事项，不会保存或改动任何数据。</p>
        </div>
        <div class="stats-grid" id="adminStats">
          <div class="stat-card">
            <div class="stat-card-icon">👤</div>
            <div class="stat-card-content">
              <span class="stat-card-label">总玩家</span>
              <span class="stat-card-number" id="statPlayers">--</span>
              <span class="stat-card-change" id="statPlayersChange">今日 +0</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">💬</div>
            <div class="stat-card-content">
              <span class="stat-card-label">待处理建议</span>
              <span class="stat-card-number" id="statPendingRequests">--</span>
              <span class="stat-card-change" id="statTotalRequests">共 0 条</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">🎯</div>
            <div class="stat-card-content">
              <span class="stat-card-label">报名中活动</span>
              <span class="stat-card-number" id="statActiveEvents">--</span>
              <span class="stat-card-change" id="statTotalSignups">共 0 人报名</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">📋</div>
            <div class="stat-card-content">
              <span class="stat-card-label">今日操作</span>
              <span class="stat-card-number" id="statTodayOps">--</span>
              <span class="stat-card-change" id="statLastOp">最近操作：--</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">🖼️</div>
            <div class="stat-card-content">
              <span class="stat-card-label">图片库</span>
              <span class="stat-card-number" id="statImageCount">--</span>
              <span class="stat-card-change" id="statImageSize">占用 --</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">📊</div>
            <div class="stat-card-content">
              <span class="stat-card-label">服务器状态</span>
              <span class="stat-card-number" style="font-size:20px;color:var(--success);">● 在线</span>
              <span class="stat-card-change">运行中</span>
            </div>
          </div>
        </div>
        ${renderOverviewDetails()}
        <div class="grid stats">
          <article class="card pad stat"><span class="icon" data-icon="users"></span><div><small>登记玩家</small><strong>${playerSessions.length}</strong><em>进入网页后登记</em></div></article>
          <article class="card pad stat"><span class="icon blue" data-icon="message"></span><div><small>玩家建议卡片</small><strong>${requests.length}</strong><em>后台可查看和删除</em></div></article>
          <article class="card pad stat"><span class="icon amber" data-icon="map"></span><div><small>玩法项目</small><strong>${playItems.length}</strong><em>后台可编辑</em></div></article>
          <article class="card pad stat"><span class="icon red" data-icon="calendar"></span><div><small>活动数量</small><strong>${updates.length}</strong><em>长期和限时活动统一管理</em></div></article>
          <article class="card pad stat"><span class="icon blue" data-icon="shield"></span><div><small>前台板块</small><strong>${Object.values(siteSections).filter(item => item.visible).length}</strong><em>可开关和排序</em></div></article>
        </div>`,
      players: () => `
        <div class="panel-title"><h3>进入网页的玩家</h3><p>玩家首次进入网页必须填写游戏内名称，后台会记录名称、进入次数和最近进入时间。</p></div>
        <div class="table"><table><thead><tr><th>游戏内名称</th><th>进入次数</th><th>最近进入</th><th>状态</th></tr></thead><tbody>
        ${playerSessions.map(player => `<tr><td>${escapeHtml(player.name)}</td><td>${player.visits}</td><td>${player.lastSeen}</td><td><span class="tag green">已登记</span></td></tr>`).join('') || '<tr><td colspan="4">暂无玩家登记。</td></tr>'}
        </tbody></table></div>`,
      visibilityManage: () => `
        <div class="panel-title"><h3>前台控制</h3><p>控制每个前台板块是否展示，并调整它们在首页或导航中的显示顺序。</p></div>
        <p class="panel-order-note">拖动左侧把手调整首页与导航展示顺序，修改后点击保存才会生效。</p>
        <div class="update-list" id="sectionOrderList">
          ${Object.entries(siteSections).sort((a, b) => (Number(a[1].order) || 0) - (Number(b[1].order) || 0)).map(([key, section]) => `
            <div class="toggle-row" draggable="true" data-section-row="${key}">
              <span class="drag-handle" title="拖动排序">☰</span>
              <div><strong>${escapeHtml(section.label)}</strong><p class="muted">模块 key：${key}</p></div>
              <label class="switch"><input type="checkbox" data-section-visible="${key}" ${section.visible ? 'checked' : ''}>展示</label>
              <label>排序<input type="number" data-section-order="${key}" value="${Number(section.order) || 0}"></label>
            </div>`).join('')}
        </div>
        <div style="height:14px"></div>
        <button class="btn-primary" id="saveVisibility">保存前台控制</button>`,
      homeManage: () => `
        <div class="panel-title"><h3>首页管理</h3><p>编辑首页主视觉、数据卡、特色卡和服务器注意事项。</p></div>
        <div class="card pad">
          <div class="panel-title"><h3>首页主视觉</h3><p>这里控制首页第一屏主图上的大标题、状态文字和介绍。</p></div>
          <div class="grid two">
            <label>首页大标题<input id="homeHeroTitle" value="${escapeAttr(serverInfo.title || 'Erp 14')}"></label>
            <label>顶部状态文字<input id="homeHeroSeason" value="${escapeAttr(serverInfo.season)}"></label>
          </div>
          <div style="height:14px"></div>
          <label>首页介绍文字<textarea id="homeHeroDescription">${escapeHtml(serverInfo.description)}</textarea></label>
          <div style="height:14px"></div>
          <button class="btn-primary" id="saveHomeHero">保存首页主视觉</button>
        </div>
        <div style="height:14px"></div>
        <div class="card pad">
          <div class="panel-title"><h3>服务器注意事项</h3><p>展示在首页，适合放入服规、入服提醒和活动注意事项。</p></div>
          <div class="grid two">
            <label>标题<input id="editRulesTitle" value="${escapeAttr(serverRules.title)}"></label>
            <label>说明<input id="editRulesDescription" value="${escapeAttr(serverRules.description)}"></label>
          </div>
          <div style="height:14px"></div>
${renderManagedImageField({
            title: '服规小插图',
            note: '首页注意事项旁边展示，建议用清晰小图。',
            images: serverRules.image ? [serverRules.image] : [],
            target: 'rules',
            fieldMarkup: `<input id="editRulesImage" value="${escapeAttr(serverRules.image)}">`,
            uploadAction: 'upload-rules-image',
            multiple: false,
            single: true,
            limit: 1
          })}
          <div style="height:14px"></div>
          <label>注意事项，每行一条，格式：标题|内容|标签<textarea id="editRulesItems">${serverRules.items.map(item => `${item.title}|${item.text}|${item.level || ''}`).map(escapeHtml).join('\n')}</textarea></label>
          <div style="height:14px"></div>
          <button class="btn-primary" id="saveHomeRules">保存注意事项</button>
        </div>
        <div style="height:14px"></div>
        <div class="card pad">
          <div class="panel-title"><h3>首页特色</h3><p>编辑首页特色标题和卡片。卡片格式：图标|颜色|标题|说明|标签1,标签2。</p></div>
          <div class="grid two">
            <label>标题<input id="editFeaturesTitle" value="${escapeAttr(homeFeatures.title)}"></label>
            <label>说明<input id="editFeaturesDescription" value="${escapeAttr(homeFeatures.description)}"></label>
          </div>
          <div style="height:14px"></div>
          <label>特色卡<textarea id="editHomeFeatures">${homeFeatures.items.map(item => `${item.icon || ''}|${item.color || ''}|${item.title || ''}|${item.text || ''}|${(item.tags || []).join(',')}`).map(escapeHtml).join('\n')}</textarea></label>
          <div style="height:14px"></div>
          <button class="btn-primary" id="saveHomeFeatures">保存首页特色</button>
        </div>
        <div style="height:14px"></div>
        <div class="card pad">
          <div class="panel-title"><h3>首页数据卡</h3><p>每行一个，格式：图标|颜色|小标题|大数字|说明。颜色可填 blue、amber、red 或留空。</p></div>
          <label>数据卡<textarea id="editHomeStats">${homeStats.map(item => `${item.icon || ''}|${item.color || ''}|${item.label || ''}|${item.value || ''}|${item.note || ''}`).map(escapeHtml).join('\n')}</textarea></label>
          <div style="height:14px"></div>
          <button class="btn-primary" id="saveHomeStats">保存数据卡</button>
        </div>`,
      groupManage: () => `
        <div class="panel-title"><h3>玩家群设置</h3><p>编辑首页右上角“加入玩家群”的按钮文字、链接和申请说明。</p></div>
        <div class="card pad">
          <div class="grid two">
            <label>按钮文字<input id="groupJoinText" value="${escapeAttr(serverInfo.joinText || '加入玩家群')}"></label>
            <label>加入链接<input id="groupJoinUrl" value="${escapeAttr(serverInfo.joinUrl || '')}"></label>
          </div>
          <div style="height:14px"></div>
          <label>加入申请说明<textarea id="groupJoinApplication">${escapeHtml(serverInfo.joinApplication || '')}</textarea></label>
          <div style="height:14px"></div>
${renderManagedImageField({
            title: '玩家群二维码',
            note: '用于玩家扫码加入群，建议上传正方形二维码。',
            images: serverInfo.joinQr ? [serverInfo.joinQr] : [],
            target: 'group',
            fieldMarkup: `<input id="groupJoinQr" value="${escapeAttr(serverInfo.joinQr || '')}">`,
            uploadAction: 'upload-group-qr',
            multiple: false,
            single: true,
            limit: 1
          })}
          <div style="height:14px"></div>
          <button class="btn-primary" id="saveGroupSettings">保存玩家群设置</button>
        </div>`,
      templateManage: () => `
        <div class="panel-title"><h3>建筑模板管理</h3><p>编辑首页建筑模板的图片、介绍、价格、库存、限购和购买入口。保存模板后才展示到前端。</p></div>
        <div class="update-list">
          ${buildingTemplates.map((item, index) => renderTemplateEditor(item, index)).join('') || '<div class="card pad">暂无建筑模板。</div>'}
        </div>
        <div class="panel-save-bar"><button class="btn btn-secondary" data-action="add-template">新增建筑模板</button></div>`,
      requestManage: () => renderRequestManagePanel(),
      playManage: () => `
        <div class="panel-title"><h3>玩法管理</h3><p>编辑玩法标签、标题、说明、图片和要点，保存后前台“玩法”页立即更新。</p></div>
        <div class="update-list">
          ${playItems.map((item, index) => renderPlayEditor(item, index)).join('')}
        </div>`,
      updateManage: () => {
        const signupUpdates = updates.map((item, i) => ({ item, i })).filter(({ item }) => inferActivityType(item) === 'signup');
        const fixedUpdates = updates.map((item, i) => ({ item, i })).filter(({ item }) => inferActivityType(item) === 'fixed');
        return `
        <div class="panel-title"><h3>每周活动管理</h3><p>编辑每周活动公告和活动卡片，保存后前台立即更新。</p></div>
        <details class="editor-section" open>
          <summary style="background:color-mix(in srgb, var(--amber) 12%, var(--surface));color:var(--amber);border-left:3px solid var(--amber);padding-left:11px">临时报名活动（${signupUpdates.length} 个）</summary>
          <div class="editor-section-body">
            <div class="panel-save-bar" style="position:static;margin-bottom:12px"><button class="btn btn-secondary" data-action="add-update" data-type="signup">新增临时报名活动</button></div>
            <div class="update-list">${signupUpdates.map(({ item, i }) => renderUpdateEditor(item, i)).join('') || '<div class="card pad">暂无临时报名活动。</div>'}</div>
          </div>
        </details>
        <details class="editor-section" open>
          <summary style="background:color-mix(in srgb, var(--primary) 12%, var(--surface));color:var(--primary-strong);border-left:3px solid var(--primary);padding-left:11px">长期固定活动（${fixedUpdates.length} 个）</summary>
          <div class="editor-section-body">
            <div class="panel-save-bar" style="position:static;margin-bottom:12px"><button class="btn btn-secondary" data-action="add-update" data-type="fixed">新增长期固定活动</button></div>
            <div class="update-list">${fixedUpdates.map(({ item, i }) => renderUpdateEditor(item, i)).join('') || '<div class="card pad">暂无长期固定活动。</div>'}</div>
          </div>
        </details>`; },
      imageLibrary: () => renderImageLibraryPanel(),
      backupManage: () => renderBackupPanel(),
      logs: () => `
        <div class="panel-title">
          <h3>操作日志</h3>
          <p>查看所有管理员的操作记录。高风险操作（删除 / 导入 / 重置 / 批量删除）用红色标注。</p>
        </div>

        <div class="card pad" style="margin-bottom:14px;padding:10px 14px;border-left:4px solid var(--danger)">
          <span class="tag danger">高风险</span> 标记表示涉及数据变更的操作（删除、导入、重置、批量删除），请留意。
        </div>

        <div class="log-filters">
          <div class="log-filter-group">
            <label>开始日期</label>
            <input type="date" id="logStartDate">
          </div>
          <div class="log-filter-group">
            <label>结束日期</label>
            <input type="date" id="logEndDate">
          </div>
          <div class="log-filter-group">
            <label>操作类型</label>
            <select id="logAction">
              <option value="">全部操作</option>
              <option value="登录">登录</option>
              <option value="创建建议">创建建议</option>
              <option value="更新建议">更新建议</option>
              <option value="删除建议">删除建议</option>
              <option value="创建活动">创建活动</option>
              <option value="更新活动">更新活动</option>
              <option value="删除活动">删除活动</option>
              <option value="更新配置">更新配置</option>
              <option value="导入数据">导入数据</option>
              <option value="批量删除">批量删除</option>
              <option value="重置">重置</option>
            </select>
          </div>
          <div class="log-filter-group">
            <label>操作人</label>
            <input type="text" id="logAdminName" placeholder="输入管理员名称">
          </div>
          <div class="log-filter-group log-filter-actions">
            <button class="btn-secondary" id="searchLogs">🔍 搜索</button>
            <button class="btn-secondary" id="resetLogs">重置</button>
          </div>
        </div>

        <div class="log-table-wrapper">
          <table class="log-table">
            <thead><tr><th style="width:20px"></th><th>时间</th><th>操作人</th><th>操作类型</th><th>详情</th><th>IP</th></tr></thead>
            <tbody id="logList"><tr><td colspan="6" class="log-empty">加载中...</td></tr></tbody>
          </table>
        </div>

        <div class="log-pagination">
          <button class="btn-secondary" id="logPrevPage">上一页</button>
          <span>第 <strong id="logCurrentPage">1</strong> / <strong id="logTotalPages">1</strong> 页</span>
          <button class="btn-secondary" id="logNextPage">下一页</button>
        </div>`,
      settings: () => `
        <div class="panel-title"><h3>网站编辑</h3><p>后台可以修改首页核心文字、服务器信息和轮播图地址。</p></div>
        <div class="grid two">
          <label>首页大标题<input id="editHeroTitle" value="${escapeAttr(serverInfo.title || 'Erp 14')}"></label>
          <label>顶部状态文字<input id="editSeason" value="${escapeAttr(serverInfo.season)}"></label>
          <label>服务器编号<input id="editServerNo" value="${escapeAttr(serverInfo.no)}"></label>
          <label>IP 地址<input id="editServerIp" value="${escapeAttr(serverInfo.ip)}"></label>
          <label>QQ群<input id="editGroup" value="${escapeAttr(serverInfo.group)}"></label>
          <label>加入按钮文字<input id="editJoinText" value="${escapeAttr(serverInfo.joinText || '加入玩家群')}"></label>
          <label>加入链接<input id="editJoinUrl" value="${escapeAttr(serverInfo.joinUrl || '')}"></label>
        </div>
        <div style="height:14px"></div>
        <label>加入申请说明<textarea id="editJoinApplication">${escapeHtml(serverInfo.joinApplication || '')}</textarea></label>
        <div style="height:14px"></div>
        <label>首页介绍文字<textarea id="editDescription">${escapeHtml(serverInfo.description)}</textarea></label>
        <div style="height:14px"></div>
${renderManagedImageField({
          title: '首页轮播图',
          note: '支持多张上传、删除和排序；保存后同步首页。',
          images: heroImages,
          target: 'hero',
          fieldMarkup: `<textarea id="editHeroImages">${heroImages.map(escapeHtml).join('\n')}</textarea>`,
          uploadAction: 'upload-hero-image',
          multiple: true,
          limit: 10
        })}
        <div style="height:14px"></div>
        <button class="btn-primary" id="saveServerInfo">保存并更新网站</button>`,
      backend: () => `
        <div class="panel-title"><h3>后端接入</h3><p>前端通过 REST API 与后端同步。</p><span class="save-state" id="panelSaveState">已保存</span></div>
        <div class="update-list">
          <div class="panel-row"><div><strong>后台可管理模块</strong><p class="muted">首页信息、轮播图、玩法、每周活动、玩家建议卡片、进入网页的玩家。</p></div><span class="tag green">完成</span></div>
          <div class="panel-row"><div><strong>玩家建议接口</strong><p class="muted">GET 配置，POST/PUT 保存各模块，DELETE 删除玩家建议卡片。</p></div><span class="tag blue">API</span></div>
          <div class="panel-row"><div><strong>当前后端地址</strong><p class="muted">后台登录后会同步保存到 <strong>${API_BASE_URL}</strong>，未登录时仍使用浏览器本地兜底。</p></div><span class="tag green">API</span></div>
        </div>`
    };

    function renderHomeStats() {
      const section = document.getElementById('homeStatsSection');
      if (!section) return;

      section.innerHTML = homeStats.map(item => `
        <div class="card pad stat-card">
          <div class="stat-card-icon">
            <span class="icon ${item.color || ''}" data-icon="${item.icon || 'shield'}"></span>
          </div>
          <div class="stat-card-content">
            <span class="stat-card-label">${escapeHtml(item.label)}</span>
            <span class="stat-card-number">${escapeHtml(item.value)}</span>
            <span class="stat-card-note">${escapeHtml(item.note)}</span>
          </div>
        </div>
      `).join('');

      applyIcons(section);
    }

    function renderHomeFeatures() {
      document.getElementById('homeFeaturesTitle').textContent = homeFeatures.title;
      document.getElementById('homeFeaturesDescription').textContent = homeFeatures.description;
      const grid = document.getElementById('homeFeatureGrid');
      const items = homeFeatures.items || [];

      if (!items.length) {
        grid.innerHTML = '<div class="card pad">暂无特色数据</div>';
        return;
      }

      grid.innerHTML = items.map(item => `
        <div class="card pad feature-card">
          <span class="icon ${item.color || ''}" data-icon="${item.icon || 'shield'}"></span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
          <div class="tag-row">
            ${(item.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      `).join('');

      applyIcons(grid);
    }


    function renderHomeSuggestions() {
      const ticker = document.getElementById('homeSuggestionTicker');
      const done = requests.filter(item => item.status === 'done');
      if (!done.length) {
        ticker.innerHTML = '<div class="suggestion-pill"><strong>暂无已完成建议</strong><p>管理员处理后的建议会显示在这里。</p></div>';
        return;
      }
      const cards = done.map(item => `
        <article class="suggestion-pill">
          <div class="tag-row"><span class="tag green">已完成</span><span class="tag">${escapeHtml(item.user)}</span></div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.text)}</p>
        </article>`).join('');
      ticker.innerHTML = `<div class="suggestion-track">${cards}${cards}</div>`;
    }

    function splitImageLines(value) {
      return String(value || '').split(/\\n|\r?\n/).map(item => item.trim()).filter(Boolean);
    }

    function normalizeTemplateImages(item) {
      const rawImages = Array.isArray(item.images) ? item.images : [];
      const images = rawImages.flatMap(splitImageLines).filter(Boolean);
      if (!images.length && item.image) images.push(...splitImageLines(item.image));
      return images;
    }

    function normalizePlayImages(item) {
      const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
      if (!images.length && item.image) images.push(item.image);
      return images;
    }

    function renderBuildingTemplates() {
      const grid = document.getElementById('buildingTemplateGrid');
      const visibleTemplates = buildingTemplates.map((item, index) => ({ item, index })).filter(entry => entry.item.onShelf !== false);
      grid.innerHTML = visibleTemplates.map(({ item, index }) => {
        const images = normalizeTemplateImages(item);
        const firstImage = images[0] || '';
        return `
        <article class="card template-card" data-template-card="${index}" data-image-index="0">
          <div class="template-media-wrap">
            <button class="template-media" type="button" data-open-image="${escapeAttr(firstImage)}" data-gallery="template-${index}" data-image-index="0" data-image-title="${escapeAttr(item.title)}" style="background-image:url('${escapeAttr(firstImage)}')"></button>
            ${images.length > 1 ? `<div class="template-controls"><button class="carousel-btn" type="button" data-template-control="prev" data-index="${index}">‹</button><button class="carousel-btn" type="button" data-template-control="next" data-index="${index}">›</button></div><span class="template-count">1 / ${images.length}</span>` : ''}
          </div>
          <div class="template-body">
            <div class="tag-row"><span class="tag amber">建筑模板</span><span class="tag green">${escapeHtml(item.price)}</span><span class="tag">库存：${escapeHtml(item.stock || '不限')}</span></div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <div class="template-meta"><span class="tag">${escapeHtml(item.limit || '不限购')}</span><span class="tag">${escapeHtml(item.note)}</span>${item.buyUrl && item.buyUrl !== '#' ? `<a class="tag green" href="${escapeAttr(item.buyUrl)}" target="_blank" rel="noopener noreferrer">购买入口</a>` : ''}</div>
          </div>
        </article>`;
      }).join('') || '<div class="card pad">暂无建筑模板。</div>';
    }

    function renderServerRules() {
      document.getElementById('homeRulesTitle').textContent = serverRules.title;
      document.getElementById('homeRulesDescription').textContent = serverRules.description;
      const content = document.getElementById('homeRulesContent');
      content.innerHTML = `
        <div class="rule-list">
          ${serverRules.items.map(item => `
            <article class="rule-item">
              <div class="tag-row"><span class="tag amber">${escapeHtml(item.level || '注意')}</span></div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </article>`).join('')}
        </div>
        <div class="rule-art" style="background-image:url('${escapeAttr(serverRules.image || heroImages[0] || '')}')"></div>`;
    }

    function applySectionControls() {
      Object.entries(siteSections).forEach(([key, section]) => {
        document.querySelectorAll(`[data-section="${key}"]`).forEach(el => {
          el.classList.toggle('is-hidden', !section.visible);
          el.classList.toggle('section-disabled', !section.visible);
          el.style.order = Number(section.order) || 0;
        });
        document.querySelectorAll(`[data-route="${key}"]`).forEach(el => {
          el.style.display = section.visible ? '' : 'none';
        });
      });
      const active = document.querySelector('.view.active');
      if (active?.dataset.section && siteSections[active.dataset.section] && !siteSections[active.dataset.section].visible) {
        switchRoute('home');
      }
    }

    function applyIcons(root = document) {
      root.querySelectorAll('[data-icon]').forEach(el => {
        const icon = icons[el.dataset.icon];
        if (icon) el.innerHTML = icon;
      });
    }

    function setTheme(theme) {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('erp14-theme', theme);
      document.getElementById('themeBtn').innerHTML = theme === 'dark' ? icons.sun : icons.moon;
    }

    function showToast(message, type = 'info', duration = 3500) {
      const toast = document.getElementById('toast');
      const icon = document.getElementById('toastIcon');
      const msg = document.getElementById('toastMessage');

      const icons = {
        success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'
      };

      clearTimeout(showToast._timer);

      icon.textContent = icons[type] || icons.info;
      msg.textContent = message;

      toast.className = 'toast';
      toast.classList.add('show', `toast-${type}`);

      showToast._timer = setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    }

    async function copyGuideText(value, successMessage, failureMessage) {
      const text = String(value || '').trim();

      if (!text) {
        showToast(failureMessage, 'warning');
        return;
      }

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const input = document.createElement('input');
          input.value = text;
          input.setAttribute('readonly', '');
          document.body.appendChild(input);
          input.select();

          const copied = document.execCommand('copy');
          input.remove();

          if (!copied) {
            throw new Error('copy failed');
          }
        }

        showToast(successMessage, 'success');
      } catch (error) {
        showToast(failureMessage, 'warning');
      }
    }

    function escapeHtml(value = '') {
      return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char]));
    }

    function escapeAttr(value = '') {
      return escapeHtml(value);
    }

    function getUpdateId(item, index = 0) {
      if (item.id) return String(item.id);
      const base = `${item.version || 'event'}-${item.title || index}`;
      return base.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '') || `event-${index}`;
    }

    function isFutureDate(value) {
      if (!value) return true;
      const time = new Date(value).getTime();
      return Number.isFinite(time) && time > Date.now();
    }

    function isSignupVisible(item) {
      const status = (item.status || '').trim();
      if (status === '已结束' || status === '结束') return false;
      return item.published !== false && item.signupEnabled === true && isFutureDate(item.signupDeadline);
    }

    function formatDateText(value) {
      if (!value) return '未设置截止';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '时间格式无效';
      return date.toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    function normalizeRequestStatus(status) {
      return status === 'planned' ? 'pending' : (status || 'pending');
    }

    function requestLabel(status) {
      return { pending: '待讨论', done: '已完成', rejected: '已拒绝' }[normalizeRequestStatus(status)] || '待讨论';
    }

    function normalizeRequestCategory(category = '') {
      if (category === 'BUG' || category === 'bug') return 'BUG';
      if (category.includes('优化')) return 'optimize';
      return 'new';
    }

    function requestCategoryLabel(category = '') {
      return { BUG: 'BUG', optimize: '优化项', new: '新建议' }[normalizeRequestCategory(category)] || '新建议';
    }

    function getRequestId(item, index = 0) {
      if (!item.id) {
        item.id = `req-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
      }
      return item.id;
    }

    function getCurrentVoterName() {
      return (activePlayerName || localStorage.getItem('erp14-player-name') || '').trim();
    }

    function getPlayerVote(item, index) {
      const voter = getCurrentVoterName();
      if (!voter) return '';
      const requestId = getRequestId(item, index);
      return requestVotes[requestId]?.[voter] || '';
    }

    function nowText() {
      return new Date().toLocaleString('zh-CN', { hour12: false });
    }

    function addLog(title, text, tag = '后台', tagClass = 'blue') {
      logs.unshift({ title, text, tag, tagClass });
      logs = logs.slice(0, 30);
      saveLocalData();
    }

    // 检测是否为高风险操作（日志标记用）
    function isHighRiskAction(action, detail) {
      var keywords = ['删除', '导入', '重置', '批量删除'];
      var combined = (action || '') + ' ' + (detail || '');
      return keywords.some(function(k) { return combined.indexOf(k) !== -1; });
    }

    function getSiteDataSnapshot() {
      return {
        heroImages,
        serverInfo,
        playItems,
        requests,
        updates,
        siteSections,
        homeStats,
        homeFeatures,
        serverRules,
        playerSessions,
        buildingTemplates,
        logs,
        imageLibrary,
        requestVotes
      };
    }

    // 在执行导入/重置等破坏性操作前自动备份当前数据
    function autoBackupForSafety(label) {
      try {
        const snapshot = getSiteDataSnapshot();
        localStorage.setItem('erp14-site-data', JSON.stringify(snapshot));
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auto-backup-${label}-${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`已先备份当前数据（${label}前自动备份）`, 'success');
        return true;
      } catch (error) {
        showToast('自动备份失败，操作已停止：' + (error.message || error), 'error');
        return false;
      }
    }

    function saveLocalData() {
      try {
        localStorage.setItem('erp14-site-data', JSON.stringify(getSiteDataSnapshot()));
        queueBackendSave();
        markPanelSaved();
      } catch (error) {
        markPanelFailed('保存失败，可能是图片数据过大');
        throw error;
      }
    }

    function backendUrl(path) {
      return `${API_BASE_URL}${path}`;
    }

    // 统一 fetch 封装
    async function fetchJson(url, options = {}) {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || errBody.error || `HTTP ${response.status}`);
      }
      const json = await response.json();
      // 兼容新旧响应格式：{ code, data: {...} } 或直接 {...}
      return json.data || json;
    }

    async function fetchWithFallback(url, options = {}) {
      try {
        return await fetchJson(url, options);
      } catch (err) {
        const fallbackUrl = FALLBACK_MAP[url];
        if (!fallbackUrl) throw err;
        console.warn(`[降级] ${url} 失败 -> ${fallbackUrl}: ${err.message}`);
        return await fetchJson(fallbackUrl, options);
      }
    }

    async function saveBackendData() {
      if (!adminToken) return false;

      const snapshot = getSiteDataSnapshot();
      const authHeaders = {
        'authorization': `Bearer ${adminToken}`,
        'content-type': 'application/json'
      };

      const FIELD_MAP = {
        title: 'site_title',
        season: 'season_text',
        description: 'site_description',
        no: 'server_no',
        ip: 'server_ip',
        group: 'group_number',
        joinText: 'join_text',
        joinUrl: 'join_url',
        joinApplication: 'join_application',
        joinQr: 'join_qr'
      };

      try {
        // 逐个字段同步到后端
        const results = await Promise.allSettled(
          Object.entries(FIELD_MAP).map(([localKey, configKey]) => {
            const value = snapshot.serverInfo?.[localKey] ?? '';
            return fetch(backendUrl('/api/admin/config'), {
              method: 'PUT',
              headers: authHeaders,
              body: JSON.stringify({ key: configKey, value })
            });
          })
        );

        // 检查是否有401
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.status === 401) {
            adminToken = '';
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            redirectToAdminLogin();
            return false;
          }
        }

        return true;
      } catch (error) {
        console.error('Save failed:', error);
        return false;
      }
    }

    function queueBackendSave() {
      if (!adminToken) return;
      clearTimeout(backendSaveTimer);
      backendSaveTimer = setTimeout(() => {
        saveBackendData().catch(() => markPanelFailed('后端同步失败'));
      }, 300);
    }

    function markPanelDirty() {
      panelDirty = true;
      const state = document.getElementById('panelSaveState');
      if (state) {
        state.textContent = '有未保存修改';
        state.className = 'save-state dirty';
      }
      document.querySelectorAll('#panelMain .btn-primary').forEach(btn => btn.classList.add('needs-save'));
    }

    function markPanelSaved() {
      panelDirty = false;
      const state = document.getElementById('panelSaveState');
      if (state) {
        state.textContent = '已保存';
        state.className = 'save-state saved';
      }
      document.querySelectorAll('#panelMain .btn-primary').forEach(btn => btn.classList.remove('needs-save'));
    }

    function markPanelFailed(message = '保存失败') {
      const state = document.getElementById('panelSaveState');
      if (state) {
        state.textContent = message;
        state.className = 'save-state failed';
      }
    }

    function hasGarbledRequests(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return false;
      // 检测是否包含 \uFFFD 替换字符（编码损坏的特征）
      const sample = JSON.stringify(arr.slice(0, 3));
      return sample.indexOf('\uFFFD') !== -1;
    }

    function containsReplacementChar(obj) {
      // 递归检测对象/数组序列化后是否包含 U+FFFD 替换字符
      if (obj === null || typeof obj === 'undefined') return false;
      if (typeof obj === 'string') return obj.indexOf('\uFFFD') !== -1;
      if (Array.isArray(obj)) return obj.some(item => containsReplacementChar(item));
      if (typeof obj === 'object') return Object.values(obj).some(value => containsReplacementChar(value));
      return false;
    }

    function loadLocalData() {
      try {
        const saved = JSON.parse(localStorage.getItem('erp14-site-data') || '{}');

        // 如果 localStorage 中任何字段包含编码损坏的替换字符，整体清除
        if (containsReplacementChar(saved)) {
          console.warn('[LocalData] 检测到编码损坏的本地数据，已整体清除');
          localStorage.removeItem('erp14-site-data');
          return;
        }

        heroImages = mergeArray(heroImages, saved.heroImages);
        serverInfo = mergeObject(serverInfo, saved.serverInfo);
        playItems = mergeArray(playItems, saved.playItems);
        requests = mergeArray(requests, saved.requests);
        updates = mergeArray(updates, saved.updates);
        normalizeUpdates();
        siteSections = mergeObject(siteSections, saved.siteSections);
        normalizeSiteSections();
        homeStats = mergeArray(homeStats, saved.homeStats);
        homeFeatures = mergeObject(homeFeatures, saved.homeFeatures);
        serverRules = mergeObject(serverRules, saved.serverRules);
        playerSessions = mergeArray(playerSessions, saved.playerSessions);
        buildingTemplates = mergeArray(buildingTemplates, saved.buildingTemplates);
        logs = mergeArray(logs, saved.logs);
        imageLibrary = mergeArray(imageLibrary, saved.imageLibrary);
        requestVotes = saved.requestVotes && typeof saved.requestVotes === 'object' && !Array.isArray(saved.requestVotes) ? saved.requestVotes : requestVotes;
      } catch (error) {
        console.info('Local site data not loaded:', error.message);
      }
    }

    function renderRequestManagePanel() {
      // 按状态分组：pending/planned → 待讨论，done → 已完成，rejected → 已拒绝
      const sections = { pending: [], done: [], rejected: [] };
      requests.forEach((item, index) => {
        const norm = normalizeRequestStatus(item.status); // pending/done/rejected
        sections[norm].push({ item, index });
      });

      function renderSection(label, items) {
        if (!items.length) return '';
        return `
          <div class="request-section" style="margin-bottom:24px">
            <div class="section-header" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);border-radius:8px;margin-bottom:12px;border:1px solid var(--border)">
              <strong>${label}</strong>
              <span class="muted">${items.length} 条</span>
            </div>
            <div class="request-admin-list">${items.map(({ item, index }) => renderRequestAdminCard(item, index)).join('')}</div>
          </div>`;
      }

      return `
        <div class="panel-title"><h3>建议处理</h3><p>按状态分区展示，可直接处理状态、回复和拒绝原因。</p><span class="save-state" id="panelSaveState">${panelDirty ? '有未保存修改' : '已保存'}</span></div>
        ${renderSection('待讨论 / 新提交建议', sections.pending)}
        ${renderSection('已完成', sections.done)}
        ${renderSection('已拒绝', sections.rejected)}
        ${!sections.pending.length && !sections.done.length && !sections.rejected.length ? '<div class="card pad" style="text-align:center;padding:40px 0"><p class="muted">暂无玩家建议</p></div>' : ''}
        <div class="panel-save-bar"><button class="btn-primary" id="saveRequestChanges">保存建议修改</button></div>`;
    }

    function renderRequestAdminCard(item, index) {
      return `
        <article class="request-admin-card ${escapeAttr(item.status || 'pending')}">
          <div class="request-admin-main">
            <div class="request-head"><h3>${escapeHtml(item.title)}</h3><span class="tag ${item.status === 'rejected' ? 'danger' : item.status === 'done' ? 'green' : item.status === 'planned' ? 'blue' : 'amber'}">${requestLabel(item.status)}</span></div>
            <p>${escapeHtml(item.text)}</p>
            <div class="tag-row"><span class="tag">提交人：${escapeHtml(item.user)}</span><span class="tag">分类：${escapeHtml(item.category || '优化')}</span><span class="tag">联系方式：${escapeHtml(item.contact || '未填写')}</span><span class="tag">图片 ${Array.isArray(item.images) ? item.images.length : 0}</span><span class="tag">同意 ${item.agree || 0} · 否定 ${item.disagree || 0}</span></div>
            ${Array.isArray(item.images) && item.images.length ? `<div class="request-images">${item.images.slice(0, 5).map(src => `<button class="request-thumb" type="button" data-open-image="${escapeAttr(src)}" data-gallery="admin-request-${index}" data-image-title="${escapeAttr(item.title)}" style="background-image:url('${escapeAttr(src)}')"></button>`).join('')}</div>` : ''}
            <div class="grid two">
              <label>处理状态<select class="request-status-select" data-request-status="${index}"><option value="pending" ${item.status === 'pending' ? 'selected' : ''}>待讨论</option><option value="planned" ${item.status === 'planned' ? 'selected' : ''}>已计划</option><option value="done" ${item.status === 'done' ? 'selected' : ''}>已完成</option><option value="rejected" ${item.status === 'rejected' ? 'selected' : ''}>已拒绝</option></select></label>
              <label>快速操作<div class="manage-actions"><button class="mini-btn" data-action="view-request" data-index="${index}">查看</button><button class="mini-btn" data-action="move-request-up" data-index="${index}">上移</button><button class="mini-btn" data-action="move-request-down" data-index="${index}">下移</button><button class="btn-danger" data-action="delete-request" data-index="${index}">删除</button></div></label>
            </div>
            <div class="request-admin-folds">
              <details class="request-admin-fold">
                <summary><span>管理员回复</span><strong>${item.adminReply ? '已填写' : '点击填写'}</strong></summary>
                <textarea data-request-reply="${index}" placeholder="可以写处理说明、计划时间或补充信息">${escapeHtml(item.adminReply || '')}</textarea>
              </details>
              <details class="request-admin-fold">
                <summary><span>拒绝原因</span><strong>${item.rejectReason ? '已填写' : '点击填写'}</strong></summary>
                <textarea data-request-reason="${index}" placeholder="状态选择已拒绝时建议填写">${escapeHtml(item.rejectReason || '')}</textarea>
              </details>
            </div>
          </div>
        </article>`;
    }


    function formatBytes(bytes) {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }

    function estimateSiteStorageBytes() {
      return JSON.stringify(getSiteDataSnapshot()).length * 2;
    }

    function renderImageStorageMeter() {
      const bytes = estimateSiteStorageBytes();
      const ratio = Math.min(100, Math.round(bytes / IMAGE_STORAGE_SOFT_LIMIT * 100));
      const state = bytes >= IMAGE_STORAGE_HARD_LIMIT ? 'danger' : bytes >= IMAGE_STORAGE_WARN_LIMIT ? 'warn' : '';
      const text = bytes >= IMAGE_STORAGE_HARD_LIMIT
        ? '已接近本地存储上限，建议删除旧图或改用外链。'
        : bytes >= IMAGE_STORAGE_WARN_LIMIT
          ? '图片较多，正式部署建议改用服务器图片地址。'
          : '当前体积正常，后期部署可切换成服务器图片地址。';
      return `<div class="image-storage-meter ${state}" id="imageLibraryUsage">
        <div><strong>配置占用估算：${formatBytes(bytes)}</strong><p class="muted">${text}</p></div>
        <div class="image-storage-bar" style="--usage:${ratio}%"><span></span></div>
      </div>`;
    }

    function renderManagedImageThumbs(images, target, ownerIndex = '', single = false) {
      const clean = (images || []).filter(Boolean);
      if (!clean.length) return '<div class="image-empty">暂无图片，点击上传添加。</div>';
      const gallery = 'managed-' + target + '-' + ownerIndex;
      return clean.map((src, imageIndex) => `
        <article class="managed-image-item">
          <button class="managed-image-thumb" type="button" data-open-image="${escapeAttr(src)}" data-gallery="${escapeAttr(gallery)}" data-image-index="${imageIndex}" data-image-title="后台图片预览" style="background-image:url('${escapeAttr(src)}')"></button>
          <div class="managed-image-actions">
            ${single ? '' : `<button class="mini-btn" data-action="move-managed-image" data-image-target="${target}" data-owner-index="${ownerIndex}" data-image-index="${imageIndex}" data-direction="-1">上移</button><button class="mini-btn" data-action="move-managed-image" data-image-target="${target}" data-owner-index="${ownerIndex}" data-image-index="${imageIndex}" data-direction="1">下移</button>`}
            <button class="btn-danger" data-action="remove-managed-image" data-image-target="${target}" data-owner-index="${ownerIndex}" data-image-index="${imageIndex}">删除</button>
          </div>
        </article>`).join('');
    }

    function renderLibraryPicker(target, ownerIndex = '', single = false) {
      const choices = imageLibrary.slice(0, IMAGE_LIBRARY_MAX_ITEMS).map((item, index) => `
        <article class="image-library-choice-card">
          <button class="image-library-choice-preview" type="button" data-open-image="${escapeAttr(item.src)}" data-gallery="library-picker-${target}-${ownerIndex}" data-image-index="${index}" data-image-title="${escapeAttr(item.name || '图片库图片')}" style="background-image:url('${escapeAttr(item.src)}')" aria-label="预览图片库图片"></button>
          <button class="mini-btn" type="button" data-action="select-library-image" data-library-index="${index}" data-image-target="${target}" data-owner-index="${ownerIndex}" data-single="${single ? 'true' : 'false'}">选用这张</button>
        </article>
      `).join('');
      return `
        <details class="image-library-picker">
          <summary>从图片库选择</summary>
          ${choices ? `<div class="image-library-picker-grid">${choices}</div>` : '<p class="muted">图片库暂无图片，先到“图片库”上传。</p>'}
        </details>`;
    }

    function renderManagedImageField({ title, note, images, target, ownerIndex = '', fieldMarkup, uploadAction, multiple = true, single = false, limit = 10 }) {
      const clean = (images || []).filter(Boolean).slice(0, limit);
      const indexAttr = ownerIndex === '' ? '' : ` data-index="${ownerIndex}"`;
      return `
        <div class="image-manager" data-image-manager data-image-target="${target}" data-owner-index="${ownerIndex}" data-single="${single ? 'true' : 'false'}" data-limit="${limit}">
          <div class="image-manager-head">
            <div><strong>${escapeHtml(title)}</strong><p class="muted">${escapeHtml(note || '')}</p></div>
            <label class="btn btn-secondary upload-btn">${multiple ? '批量上传图片' : '上传图片'}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" ${multiple ? 'multiple' : ''} data-action="${uploadAction}"${indexAttr}></label>
          </div>
          <div class="image-thumb-grid" data-managed-thumbs>${renderManagedImageThumbs(clean, target, ownerIndex, single)}</div>
          ${renderLibraryPicker(target, ownerIndex, single)}
          <details class="image-address-fold">
            <summary>高级：图片地址</summary>
            ${fieldMarkup}
          </details>
        </div>`;
    }

    function getManagedImageField(target, ownerIndex = '') {
      if (target === 'hero') return document.getElementById('editHeroImages');
      if (target === 'rules') return document.getElementById('editRulesImage');
      if (target === 'group') return document.getElementById('groupJoinQr');
      if (target === 'play') return document.querySelector(`[data-play-field="images"][data-index="${ownerIndex}"]`);
      if (target === 'template') return document.querySelector(`[data-template-field="images"][data-index="${ownerIndex}"]`);
      return null;
    }

    function readManagedImages(target, ownerIndex = '') {
      const field = getManagedImageField(target, ownerIndex);
      if (!field) return [];
      if (field.tagName === 'TEXTAREA') return field.value.split('\n').map(item => item.trim()).filter(Boolean);
      return field.value.trim() ? [field.value.trim()] : [];
    }

    function setManagedImages(target, ownerIndex = '', images = []) {
      const field = getManagedImageField(target, ownerIndex);
      if (!field) return;
      const clean = images.filter(Boolean);
      if (field.tagName === 'TEXTAREA') field.value = clean.join('\n');
      else field.value = clean[0] || '';
      if (target === 'play') {
        const main = document.querySelector(`[data-play-field="image"][data-index="${ownerIndex}"]`);
        if (main) main.value = clean[0] || '';
      }
      markPanelDirty();
      refreshManagedImageManager(target, ownerIndex);
    }

    function refreshManagedImageManager(target, ownerIndex = '') {
      const manager = document.querySelector(`[data-image-manager][data-image-target="${target}"][data-owner-index="${ownerIndex}"]`);
      if (!manager) return;
      const images = readManagedImages(target, ownerIndex).slice(0, Number(manager.dataset.limit) || 10);
      const thumbs = manager.querySelector('[data-managed-thumbs]');
      if (thumbs) thumbs.innerHTML = renderManagedImageThumbs(images, target, ownerIndex, manager.dataset.single === 'true');
    }

    function removeManagedImage(target, ownerIndex, imageIndex) {
      const images = readManagedImages(target, ownerIndex);
      images.splice(imageIndex, 1);
      setManagedImages(target, ownerIndex, images);
      showToast('图片已从当前模块移除，点击保存后生效', 'info');
    }

    function moveManagedImage(target, ownerIndex, imageIndex, direction) {
      const images = readManagedImages(target, ownerIndex);
      if (!moveItem(images, imageIndex, direction)) return;
      setManagedImages(target, ownerIndex, images);
    }

    function selectLibraryImage(target, ownerIndex, libraryIndex, single = false) {
      const item = imageLibrary[libraryIndex];
      if (!item?.src) {
        showToast('图片库没有找到这张图片', 'info');
        return;
      }
      const manager = document.querySelector(`[data-image-manager][data-image-target="${target}"][data-owner-index="${ownerIndex}"]`);
      const limit = Number(manager?.dataset.limit) || 10;
      const current = readManagedImages(target, ownerIndex);
      const next = single ? [item.src] : [...current, item.src].slice(0, limit);
      if (!single && current.length >= limit) {
        showToast(`最多只能保留 ${limit} 张图片`, 'warning');
        return;
      }
      setManagedImages(target, ownerIndex, next);
      showToast('已从图片库选入，点击保存后展示', 'info');
    }

    function appendManagedImages(target, ownerIndex, fileList, limit, toastLabel, maxSide = 1280) {
      const current = readManagedImages(target, ownerIndex);
      const room = Math.max(0, limit - current.length);
      if (!room) {
        showToast('最多只能保留 ' + limit + ' 张图片', 'warning');
        return;
      }
      if (adminToken) {
        uploadImageFilesToBackend(fileList, room).then(images => {
          if (!images.length) return;
          setManagedImages(target, ownerIndex, [...current, ...images].slice(0, limit));
          showToast('已上传 ' + images.length + ' 张' + toastLabel + '，点击保存后展示', 'success');
        }).catch(() => {
          showToast('上传到后端失败，请确认本地后端已启动', 'error');
        });
        return;
      }
      readImageFiles(fileList, room, images => {
        if (!images.length) return;
        setManagedImages(target, ownerIndex, [...current, ...images].slice(0, limit));
        showToast('已添加 ' + images.length + ' 张' + toastLabel + '，点击保存后展示', 'success');
      }, { maxSide });
    }

    function renderPlayEditor(item, index) {
      return `
        <div class="card pad">
          <div class="panel-title"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.subtitle)}</p></div>
          <div class="grid two">
            <label>标题<input data-play-field="title" data-index="${index}" value="${escapeAttr(item.title)}"></label>
            <label>图标<input data-play-field="icon" data-index="${index}" value="${escapeAttr(item.icon)}"></label>
            <label>标签 key<input data-play-field="key" data-index="${index}" value="${escapeAttr(item.key)}"></label>
            <input type="hidden" data-play-field="image" data-index="${index}" value="${escapeAttr(item.image)}">
          </div>
          <div style="height:14px"></div>
${renderManagedImageField({
            title: '玩法图片',
            note: '前台玩法页会展示这些图片，最多 10 张。',
            images: normalizePlayImages(item),
            target: 'play',
            ownerIndex: index,
            fieldMarkup: `<textarea data-play-field="images" data-index="${index}">${normalizePlayImages(item).map(escapeHtml).join('\\n')}</textarea>`,
            uploadAction: 'upload-play-image',
            multiple: true,
            limit: 10
          })}
          <div style="height:14px"></div>
          <label>副标题<input data-play-field="subtitle" data-index="${index}" value="${escapeAttr(item.subtitle)}"></label>
          <div style="height:14px"></div>
          <label>说明<textarea data-play-field="text" data-index="${index}">${escapeHtml(item.text || item.description || '')}</textarea></label>
          <div style="height:14px"></div>
          <label>要点，每行一个<textarea data-play-field="points" data-index="${index}">${(item.points || []).map(escapeHtml).join('\n')}</textarea></label>
          <div style="height:14px"></div>
          <div class="manage-actions"><button class="mini-btn" data-action="move-play-up" data-index="${index}">上移</button><button class="mini-btn" data-action="move-play-down" data-index="${index}">下移</button><button class="btn-primary" data-action="save-play" data-index="${index}">保存玩法</button><button class="btn btn-secondary" data-action="add-play">新增玩法</button><button class="btn-danger" data-action="delete-play" data-index="${index}">删除</button></div>
        </div>`;
    }

    function renderTemplateEditor(item, index) {
      const images = normalizeTemplateImages(item);
      return `
        <div class="card pad">
          <div class="panel-title"><h3>${escapeHtml(item.title || '建筑模板')}</h3><p>${escapeHtml(item.price || '')}</p></div>
          <div class="grid two">
            <label>模板名称<input data-template-field="title" data-index="${index}" value="${escapeAttr(item.title)}"></label>
            <label>购买价格<input data-template-field="price" data-index="${index}" value="${escapeAttr(item.price)}"></label>
            <label>是否上架<select data-template-field="onShelf" data-index="${index}"><option value="true" ${item.onShelf !== false ? 'selected' : ''}>上架</option><option value="false" ${item.onShelf === false ? 'selected' : ''}>下架</option></select></label>
            <label>库存<input data-template-field="stock" data-index="${index}" value="${escapeAttr(item.stock || '')}"></label>
            <label>限购<input data-template-field="limit" data-index="${index}" value="${escapeAttr(item.limit || '')}"></label>
            <label>购买入口<input data-template-field="buyUrl" data-index="${index}" value="${escapeAttr(item.buyUrl || '')}"></label>
          </div>
          <div style="height:14px"></div>
${renderManagedImageField({
            title: '建筑模板图片',
            note: '建议至少 5 张，最多 10 张，可排序。',
            images,
            target: 'template',
            ownerIndex: index,
            fieldMarkup: `<textarea class="template-editor-images" data-template-field="images" data-index="${index}">${images.map(escapeHtml).join('\n')}</textarea>`,
            uploadAction: 'upload-template-image',
            multiple: true,
            limit: 10
          })}
          <div style="height:14px"></div>
          <label>模板介绍<textarea data-template-field="description" data-index="${index}">${escapeHtml(item.description)}</textarea></label>
          <div style="height:14px"></div>
          <label>备注<textarea data-template-field="note" data-index="${index}">${escapeHtml(item.note)}</textarea></label>
          <div style="height:14px"></div>
          <div class="manage-actions"><button class="mini-btn" data-action="move-template-up" data-index="${index}">上移</button><button class="mini-btn" data-action="move-template-down" data-index="${index}">下移</button><button class="btn-primary" data-action="save-template" data-index="${index}">保存模板</button><button class="btn-danger" data-action="delete-template" data-index="${index}">删除</button></div>
        </div>`;
    }

    function parseRows(value, mapper) {
      return value.split('\n').map(row => row.trim()).filter(Boolean).map(row => mapper(row.split('|').map(part => part.trim())));
    }

    function renderUpdateEditor(item, index) {
      const eventId = getUpdateId(item, index);
      const signups = eventSignupDetails[eventId] || [];
      const activityType = inferActivityType(item);
      const currentStatus = (item.status || '').trim();
      const results = item.results || [];
      const hasResults = results.length > 0;
      const statusOptions = activityType === 'fixed'
        ? [{ label: '常驻', value: '常驻' }, { label: '进行中', value: '进行中' }, { label: '已结束', value: '已结束' }, { label: '已颁奖', value: '已颁奖' }]
        : [{ label: '报名中', value: '报名中' }, { label: '进行中', value: '进行中' }, { label: '已结束', value: '已结束' }, { label: '已颁奖', value: '已颁奖' }];
      const statusButtons = statusOptions.map(opt => {
        const active = currentStatus === opt.value || (!currentStatus && ((opt.value === '报名中' && activityType === 'signup') || (opt.value === '常驻' && activityType === 'fixed')));
        return `<button class="status-btn ${active ? 'active' : ''}" type="button" data-status-select="${opt.value}" data-index="${index}">${opt.label}</button>`;
      }).join('');
      const resultsRows = results.map((r, ri) => `<tr data-results-row="${ri}"><td><input class="rank-input" data-results-rank value="${r.rank || ''}" placeholder="-"></td><td><input data-results-player value="${escapeAttr(r.player || '')}" placeholder="玩家名"></td><td><input data-results-score value="${escapeAttr(r.score || '')}" placeholder="成绩"></td><td><input data-results-reward value="${escapeAttr(r.reward || '')}" placeholder="奖励"></td><td><button class="del-btn" type="button" data-action="del-result-row" data-index="${index}">×</button></td></tr>`).join('');
      const signupControls = activityType === 'signup' ? `
          <div class="grid two">
            <label>报名截止时间<input type="datetime-local" data-update-field="signupDeadline" data-index="${index}" value="${escapeAttr(item.signupDeadline || '')}"></label>
            <label>活动结束时间<input type="datetime-local" data-update-field="eventEndAt" data-index="${index}" value="${escapeAttr(item.eventEndAt || '')}"></label>
          </div>
          <div style="height:10px"></div>
          <div class="panel-checks">
            <label class="panel-check"><input type="checkbox" data-update-check="signupEnabled" data-index="${index}" ${item.signupEnabled ? 'checked' : ''}>允许报名</label>
            <span class="tag green">已报名 ${signups.length} 人</span>
          </div>
          ${signups.length ? `<div class="panel-row"><div><strong>报名名单</strong><p class="muted signup-list-text">${signups.map(player => `${escapeHtml(player.playerName)}${player.note ? ' / ' + escapeHtml(player.note) : ' / 无备注'}`).join('<br>')}</p></div></div>` : ''}
          <div style="height:10px"></div>
          <div class="grid two">
            <label>手动添加报名<input data-manual-signup-name data-index="${index}" placeholder="输入玩家名"></label>
            <label>备注<input data-manual-signup-note data-index="${index}" placeholder="备注（可选）"></label>
          </div>
          <button class="mini-btn" type="button" data-action="manual-signup" data-index="${index}">添加报名</button>` : `
          <input type="hidden" data-update-field="signupDeadline" data-index="${index}" value="">
          <input type="hidden" data-update-field="eventEndAt" data-index="${index}" value="">
          <div class="signup-empty">长期固定活动只展示内容，不开启玩家报名。</div>`;
      return `
        <div class="card pad">
          <input type="hidden" data-update-field="status" data-index="${index}" value="${escapeAttr(currentStatus)}">
          <input type="hidden" data-update-field="activityType" data-index="${index}" value="${activityType}">
          <div class="activity-enhance-toolbar">
            <button class="btn-secondary" data-action="duplicate-update" data-index="${index}">📋 复制为新一期</button>
            <button class="btn-secondary" data-action="end-event" data-index="${index}">🏁 结束活动</button>
            <button class="btn-secondary" data-action="import-signups" data-index="${index}">📥 导入报名到结果</button>
          </div>
          <details class="editor-section" open>
            <summary>基本信息</summary>
            <div class="editor-section-body">
              <label>活动类型<select data-update-field="activityType-select" data-index="${index}"><option value="fixed" ${activityType === 'fixed' ? 'selected' : ''}>长期固定活动</option><option value="signup" ${activityType === 'signup' ? 'selected' : ''}>临时报名活动</option></select></label>
              <div style="height:10px"></div>
              <label>标题<input data-update-field="title" data-index="${index}" value="${escapeAttr(item.title)}"></label>
              <input type="hidden" data-update-field="version" data-index="${index}" value="${escapeAttr(item.version || '活动')}">
              <div style="height:10px"></div>
              <div>状态</div>
              <div class="status-btn-group">${statusButtons}</div>
              <div style="height:10px"></div>
              <div class="panel-checks">
                <label class="panel-check"><input type="checkbox" data-update-check="published" data-index="${index}" ${item.published !== false ? 'checked' : ''}>已发布</label>
              </div>
            </div>
          </details>
          <details class="editor-section" open>
            <summary>活动内容</summary>
            <div class="editor-section-body">
              <div class="grid two">
                <label>开放时间<input data-update-field="schedule" data-index="${index}" value="${escapeAttr(item.schedule || '')}" placeholder="如：每周六 20:00-22:00"></label>
                <label>奖励<input data-update-field="reward" data-index="${index}" value="${escapeAttr(item.reward || '')}" placeholder="如：参与5000金币"></label>
              </div>
              <div style="height:10px"></div>
              <label>内容/规则<textarea data-update-field="rules" data-index="${index}" placeholder="活动规则和玩法说明">${escapeHtml(item.rules || item.text || '')}</textarea></label>
              <div style="height:10px"></div>
              <label>备注<input data-update-field="notes" data-index="${index}" value="${escapeAttr(item.notes || '')}" placeholder="如：提前10分钟到集合点"></label>
            </div>
          </details>
          ${activityType === 'signup' ? `
          <details class="editor-section" open>
            <summary>报名设置</summary>
            <div class="editor-section-body">
              ${signupControls}
            </div>
          </details>` : ''}
          <details class="editor-section" ${hasResults ? 'open' : ''}>
            <summary>结果排名</summary>
            <div class="editor-section-body">
              <table class="results-editor">
                <thead><tr><th>排名</th><th>玩家名</th><th>成绩</th><th>奖励</th><th></th></tr></thead>
                <tbody id="resultsBody-${index}">${resultsRows}</tbody>
              </table>
              <div style="height:8px"></div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="mini-btn" type="button" data-action="add-result-row" data-index="${index}">+ 添加排名行</button>
                ${signups.length ? `<button class="mini-btn" type="button" data-action="import-signups-to-results" data-index="${index}">从报名名单导入</button>` : ''}
              </div>
              <div style="height:10px"></div>
              <label>发奖日期<input data-update-field="rewardDate" data-index="${index}" value="${escapeAttr(item.rewardDate || '')}" placeholder="如：2026-07-05"></label>
            </div>
          </details>
          <div class="manage-actions"><button class="mini-btn" data-action="move-update-up" data-index="${index}">上移</button><button class="mini-btn" data-action="move-update-down" data-index="${index}">下移</button><button class="btn-primary" data-action="save-update" data-index="${index}">保存活动</button><button class="btn-danger" data-action="delete-update" data-index="${index}">删除</button></div>
        </div>`;
    }

    const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
    const IMAGE_LIBRARY_MAX_ITEMS = 60;
    const IMAGE_STORAGE_WARN_LIMIT = 6 * 1024 * 1024;
    const IMAGE_STORAGE_SOFT_LIMIT = 8 * 1024 * 1024;
    const IMAGE_STORAGE_HARD_LIMIT = 9 * 1024 * 1024;

    function readImageFile(file, callback, options = {}) {
      readImageFiles([file], 1, images => {
        if (images[0]) callback(images[0]);
      }, options);
    }

    function getAcceptedImageFiles(fileList, maxCount) {
      const files = Array.from(fileList || []).slice(0, maxCount).filter(Boolean);
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const accepted = [];
      files.forEach(file => {
        if (!allowed.includes(file.type)) {
          showToast('只支持 JPG、PNG、WEBP、GIF 图片', 'warning');
          return;
        }
        if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
          showToast('单张图片不能超过 5MB', 'error');
          return;
        }
        accepted.push(file);
      });
      return accepted;
    }

    function readImageFiles(fileList, maxCount, callback, options = {}) {
      const accepted = getAcceptedImageFiles(fileList, maxCount);
      if (!accepted.length) {
        showToast('请选择符合格式和大小的图片', 'warning');
        callback([]);
        return;
      }
      const results = [];
      let finished = 0;
      accepted.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const maxSide = options.maxSide || 1280;
            const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            results.push(canvas.toDataURL('image/jpeg', 0.72));
            finished += 1;
            if (finished === accepted.length) callback(results);
          };
          img.onerror = () => {
            results.push(reader.result);
            finished += 1;
            if (finished === accepted.length) callback(results);
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    }

    async function uploadImageFilesToBackend(fileList, maxCount) {
      if (!adminToken) return [];
      const accepted = getAcceptedImageFiles(fileList, maxCount);
      if (!accepted.length) {
        showToast('请选择符合格式和大小的图片', 'warning');
        return [];
      }
      const urls = [];
      for (const file of accepted) {
        const form = new FormData();
        form.append('file', file);
        const response = await fetch(backendUrl('/api/images/upload'), {
          method: 'POST',
          headers: { 'authorization': `Bearer ${adminToken}` },
          body: form
        });
        if (!response.ok) throw new Error('UPLOAD_FAILED');
        const body = await response.json();
        urls.push(new URL(body.data?.url || body.url, API_BASE_URL).toString());
      }
      return urls;
    }

    function mergeObject(current, incoming) {
      if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return current;
      const merged = { ...current, ...incoming };
      // 修复：后端空 items 不覆盖默认值
      if ('items' in incoming && Array.isArray(incoming.items) && incoming.items.length === 0 && Array.isArray(current.items) && current.items.length > 0) {
        merged.items = current.items;
      }
      return merged;
    }

    function mergeArray(current, incoming) {
      return Array.isArray(incoming) && incoming.length > 0 ? incoming : current;
    }

    function inferActivityType(item) {
      if (item.activityType === 'fixed' || item.activityType === 'signup') return item.activityType;
      const text = `${item.version || ''} ${item.status || ''} ${item.title || ''}`;
      const looksLikeActivity = /活动|报名|评选|空投/.test(text);
      if (item.signupEnabled || looksLikeActivity) return 'signup';
      return 'fixed';
    }

    function normalizeUpdates() {
      updates = updates.map((item, index) => {
        const text = `${item.version || ''} ${item.status || ''} ${item.title || ''}`;
        const legacyPublished = item.status !== '草稿' && item.status !== '计划中';
        const activityType = inferActivityType(item);
        // 兼容后端 events 表的 content 字段与旧格式的 text 字段
        const normalizedItem = {
          ...item,
          text: item.text || item.content || ''
        };
        return {
          id: getUpdateId(item, index),
          activityType,
          published: item.published ?? legacyPublished,
          signupEnabled: activityType === 'signup' ? Boolean(item.signupEnabled ?? /活动|报名|评选|空投/.test(text)) : false,
          signupDeadline: item.signupDeadline || '',
          eventEndAt: item.eventEndAt || '',
          ...normalizedItem,
          activityType,
          signupEnabled: activityType === 'signup' ? Boolean(item.signupEnabled ?? /活动|报名|评选|空投/.test(text)) : false
        };
      });
    }

    function normalizeSiteSections() {
      delete siteSections.login;
    }

    function applyContentOverrides() {
      contentOverrides.forEach(item => {
        document.querySelectorAll(item.selector).forEach(el => {
          if (typeof item.text === 'string') el.textContent = item.text;
          if (typeof item.html === 'string') el.innerHTML = item.html;
          if (item.attrs && typeof item.attrs === 'object') {
            Object.entries(item.attrs).forEach(([key, value]) => el.setAttribute(key, value));
          }
        });
      });
      applyIcons();
    }

    // 仅合并公开字段（未登录访客也允许拿到这些数据）。
    // 敏感字段（playerSessions / requests 联系方式 / logs / requestVotes / imageLibrary）
    // 只在管理员登录后通过 applyFullBackendConfig 合并。
    function applyPublicBackendConfig(config) {
      heroImages = mergeArray(heroImages, config.heroImages);
      // /api/config 返回 site_title/site_description/season_text 等字段，
      // 组装成 serverInfo 对象供渲染使用
      if (config.serverInfo) {
        serverInfo = mergeObject(serverInfo, config.serverInfo);
      } else if (config.site_title !== undefined || config.site_description !== undefined) {
        serverInfo = mergeObject(serverInfo, {
          title: config.site_title || serverInfo.title,
          season: config.season_text || serverInfo.season,
          description: config.site_description || serverInfo.description,
          no: config.server_no || serverInfo.no,
          ip: config.server_ip || serverInfo.ip,
          group: config.group_number || serverInfo.group,
          joinText: config.join_text || serverInfo.joinText,
          joinUrl: config.join_url || serverInfo.joinUrl,
          joinQr: config.join_qr || serverInfo.joinQr,
          joinApplication: config.join_application || serverInfo.joinApplication
        });
      }
      playItems = mergeArray(playItems, config.playItems);
      if (Array.isArray(config.updates)) {
        config.updates.forEach((backendItem, i) => {
          if (i < updates.length) {
            updates[i] = { ...backendItem, status: updates[i].status || backendItem.status };
          } else {
            updates.push(backendItem);
          }
        });
      }
      normalizeUpdates();
      siteSections = mergeObject(siteSections, config.siteSections);
      normalizeSiteSections();
      homeStats = mergeArray(homeStats, config.homeStats);
      homeFeatures = mergeObject(homeFeatures, config.homeFeatures);
      serverRules = mergeObject(serverRules, config.serverRules);
      buildingTemplates = mergeArray(buildingTemplates, config.buildingTemplates);
      if (Array.isArray(config.requests)) {
        requests = mergeArray(requests, config.requests);
      }
      renderAll();
    }

    // 合并完整配置（含敏感字段），仅在管理员登录后调用。
    function applyFullBackendConfig(config) {
      applyPublicBackendConfig(config);
      requests = mergeArray(requests, config.requests);
      playerSessions = mergeArray(playerSessions, config.playerSessions);
      logs = mergeArray(logs, config.logs);
      imageLibrary = mergeArray(imageLibrary, config.imageLibrary);
      requestVotes = mergeObject(requestVotes, config.requestVotes);
      panelViews = mergeObject(panelViews, config.panelViews);
      contentOverrides = mergeArray(contentOverrides, config.contentOverrides);
      renderAll();
    }

    // 兼容旧调用名（仅登录后用完整合并）。
    function applyBackendConfig(config) {
      applyFullBackendConfig(config);
    }

    // 未登录访客：并行请求各模块
    async function loadPublicBackendConfig() {
      try {
        const [cfg, heroData, playsData, evtsData, reqData] = await Promise.allSettled([
          fetchWithFallback(PUBLIC_CONFIG_URL),
          fetchWithFallback(HERO_URL),
          fetchWithFallback(PLAYS_URL),
          fetchWithFallback(EVENTS_URL),
          fetchWithFallback(`${API_BASE_URL}/api/requests?status=pending,done,rejected`).catch(() =>
            fetchWithFallback(`${API_BASE_URL}/api/requests`)
          ),
        ]);

        // 合并各模块数据
        const merged = {};

        if (cfg.status === 'fulfilled') Object.assign(merged, cfg.value);
        else console.warn('[降级] /api/config 失败');

        if (heroData.status === 'fulfilled') merged.heroImages = heroData.value.data || heroData.value;
        if (playsData.status === 'fulfilled') merged.playItems = playsData.value.data || playsData.value;
        if (evtsData.status === 'fulfilled') merged.updates = evtsData.value;
        // API 返回 {code: 200, data: [...], message: "success"}，需要取 .data
        if (reqData.status === 'fulfilled') {
          const raw = reqData.value;
          // 兼容分页格式 {items: [...], pagination: {...}} 和旧数组格式
          merged.requests = Array.isArray(raw) ? raw
            : Array.isArray(raw?.items) ? raw.items
            : Array.isArray(raw?.data) ? raw.data
            : undefined;
        }

        applyPublicBackendConfig(merged);
        loadEventSignupCounts();
      } catch (error) {
        console.info('Public backend config not loaded:', error.message);
      }
    }

    // 加载统计数据
    async function loadStats() {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!response.ok) throw new Error('Failed to load stats');
        const result = await response.json();
        const data = result.data || result;

        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        setText('statPlayers', data.totalPlayers || 0);
        setText('statPlayersChange', `今日 +${data.newPlayersToday || 0}`);
        setText('statPendingRequests', data.pendingRequests || 0);
        setText('statTotalRequests', `共 ${data.totalRequests || 0} 条`);
        setText('statActiveEvents', data.activeEvents || 0);
        setText('statTotalSignups', `共 ${data.totalSignups || 0} 人报名`);
        setText('statTodayOps', data.todayOperations || 0);
        setText('statLastOp', data.lastOperation ? `最近操作：${data.lastOperation}` : '暂无操作');
        setText('statImageCount', data.imageCount || 0);
        setText('statImageSize', `占用 ${data.imageSize || '0 MB'}`);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    }

    let logPage = 1;
    const LOG_LIMIT = 20;

    async function loadLogs(page = 1) {
      const startDate = document.getElementById('logStartDate')?.value || '';
      const endDate = document.getElementById('logEndDate')?.value || '';
      const action = document.getElementById('logAction')?.value || '';
      const adminName = document.getElementById('logAdminName')?.value?.trim() || '';

      let url = `/api/admin/logs?page=${page}&limit=${LOG_LIMIT}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (action) url += `&action=${encodeURIComponent(action)}`;
      if (adminName) url += `&adminName=${encodeURIComponent(adminName)}`;

      try {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!response.ok) throw new Error('Failed to load logs');
        const result = await response.json();
        const data = result.data || result;

        const tbody = document.getElementById('logList');
        if (!data.items || data.items.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="log-empty">暂无日志记录</td></tr>';
        } else {
          tbody.innerHTML = data.items.map(log => {
            const highRisk = isHighRiskAction(log.action, log.detail);
            const riskClass = highRisk ? ' class="log-row-high-risk"' : '';
            const riskTag = highRisk ? '<span class="tag danger" style="margin:0">高风险</span>' : '<span style="display:inline-block;width:16px"></span>';
            return `<tr${riskClass}>
              <td>${riskTag}</td>
              <td>${escapeHtml(log.created_at || '')}</td>
              <td><strong>${escapeHtml(log.admin_name || '')}</strong></td>
              <td><span class="tag">${escapeHtml(log.action || '')}</span></td>
              <td>${escapeHtml(log.detail || '')}</td>
              <td>${escapeHtml(log.ip || '-')}</td>
            </tr>`;
          }).join('');
        }

        document.getElementById('logCurrentPage').textContent = data.pagination?.page || 1;
        document.getElementById('logTotalPages').textContent = data.pagination?.totalPages || 1;
        logPage = data.pagination?.page || 1;
      } catch (error) {
        const tbody = document.getElementById('logList');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="log-empty">加载失败，请重试</td></tr>';
      }
    }

    function initLogEvents() {
      const searchBtn = document.getElementById('searchLogs');
      const resetBtn = document.getElementById('resetLogs');
      const prevBtn = document.getElementById('logPrevPage');
      const nextBtn = document.getElementById('logNextPage');
      if (searchBtn) searchBtn.addEventListener('click', () => loadLogs(1));
      if (resetBtn) resetBtn.addEventListener('click', () => {
        const sd = document.getElementById('logStartDate'); if (sd) sd.value = '';
        const ed = document.getElementById('logEndDate'); if (ed) ed.value = '';
        const la = document.getElementById('logAction'); if (la) la.value = '';
        const an = document.getElementById('logAdminName'); if (an) an.value = '';
        loadLogs(1);
      });
      if (prevBtn) prevBtn.addEventListener('click', () => { if (logPage > 1) loadLogs(logPage - 1); });
      if (nextBtn) nextBtn.addEventListener('click', () => {
        const total = parseInt(document.getElementById('logTotalPages')?.textContent || '1');
        if (logPage < total) loadLogs(logPage + 1);
      });
    }

    // 自定义确认弹窗
    function confirmAction(title, message, onConfirm) {
      return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title || '确认操作';
        document.getElementById('confirmMessage').textContent = message || '确定要执行此操作吗？';

        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        function cleanup() {
          modal.classList.remove('show');
          modal.setAttribute('hidden', '');
          okBtn.removeEventListener('click', handleOk);
          cancelBtn.removeEventListener('click', handleCancel);
        }

        function handleOk() {
          cleanup();
          if (typeof onConfirm === 'function') onConfirm();
          resolve(true);
        }

        function handleCancel() {
          cleanup();
          resolve(false);
        }

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);

        modal.addEventListener('click', function(e) {
          if (e.target === modal) handleCancel();
        });

        function handleEsc(e) {
          if (e.key === 'Escape') { handleCancel(); document.removeEventListener('keydown', handleEsc); }
        }
        document.addEventListener('keydown', handleEsc);

        modal.classList.add('show');
        modal.removeAttribute('hidden');
        okBtn.focus();
      });
    }

    // 增强确认弹窗：要求输入指定文字才能确认
    function promptConfirmAction(title, message, requiredText) {
      return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title || '确认操作';
        document.getElementById('confirmMessage').innerHTML = (message || '') +
          '<br><br><label>请输入 <strong>' + requiredText + '</strong> 以确认：<input type="text" id="promptConfirmInput" style="width:100%;margin-top:6px;padding:8px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-size:14px" placeholder="' + requiredText + '"></label>';

        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');
        const input = document.getElementById('promptConfirmInput');

        okBtn.disabled = true;
        okBtn.style.opacity = '0.5';

        function checkInput() {
          const match = input && input.value.trim() === requiredText;
          okBtn.disabled = !match;
          okBtn.style.opacity = match ? '1' : '0.5';
        }
        input.addEventListener('input', checkInput);
        input.addEventListener('paste', function() { setTimeout(checkInput, 50); });

        function cleanup() {
          modal.classList.remove('show');
          modal.setAttribute('hidden', '');
          okBtn.removeEventListener('click', handleOk);
          cancelBtn.removeEventListener('click', handleCancel);
          okBtn.disabled = false;
          okBtn.style.opacity = '1';
          if (input) input.value = '';
        }
        function handleOk() { cleanup(); resolve(true); }
        function handleCancel() { cleanup(); resolve(false); }
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', function(e) { if (e.target === modal) handleCancel(); });
        function handleEsc(e) { if (e.key === 'Escape') { handleCancel(); document.removeEventListener('keydown', handleEsc); } }
        document.addEventListener('keydown', handleEsc);
        modal.classList.add('show');
        modal.removeAttribute('hidden');
        setTimeout(function() { if (input) input.focus(); }, 100);
      });
    }

    // 管理员登录后：拉取完整配置（含敏感字段）。
    async function loadFullBackendConfig() {
      if (!adminToken) return;
      try {
        // 并行拉取配置和 requests
        const [cfgResp, reqResp] = await Promise.allSettled([
          fetchJson(backendUrl('/api/admin/config'), {
            cache: 'no-store',
            headers: { authorization: `Bearer ${adminToken}` }
          }),
          fetchJson(backendUrl('/api/admin/requests'), {
            cache: 'no-store',
            headers: { authorization: `Bearer ${adminToken}` }
          }),
        ]);

        // 处理配置
        if (cfgResp.status === 'fulfilled') {
          const cfgData = cfgResp.value;
          // API 返回 {code: 200, data: {...}}，提取 data
          const configPayload = cfgData?.data || cfgData;
          applyFullBackendConfig(configPayload);
        }

        // 处理 requests
        if (reqResp.status === 'fulfilled') {
          const raw = reqResp.value;
          const reqs = Array.isArray(raw) ? raw
            : Array.isArray(raw?.items) ? raw.items
            : Array.isArray(raw?.data) ? raw.data
            : undefined;
          if (Array.isArray(reqs)) {
            requests = mergeArray(requests, reqs);
          }
        }

        loadEventSignupCounts();
        loadAdminEventSignups();
        showToast('已加载后端完整配置', 'success');
      } catch (error) {
        if (error.message.includes('401') || error.message.includes('未登录')) {
          adminToken = '';
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          redirectToAdminLogin();
          return;
        }
        console.info('Full backend config not loaded:', error.message);
      }
    }

    async function handleAdminLogin(event) {
      event.preventDefault();
      const username = document.getElementById('adminUser').value;
      const password = document.getElementById('adminPass').value;
      try {
        const response = await fetch(backendUrl('/api/admin/login'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const body = await response.json();
        const token = body.data?.token || body.token;
        if (!response.ok || !token) {
          showToast(body.message || body.error || '管理员密码错误');
          return;
        }
        adminToken = token;
        localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
        await saveBackendData();
        markPanelSaved();
        showToast('管理员登录成功，已连接本地后端', 'success');
        // 登录成功后拉取完整配置（含敏感字段），覆盖初始化时的公开配置。
        await loadFullBackendConfig();
        loadAdminEventSignups();
        renderPanel('overview');
      } catch (error) {
        showToast('无法连接本地后端，请确认 3000 端口已启动', 'error');
      }
    }

    function switchRoute(route) {
      document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === route));
      document.querySelectorAll('[data-route]').forEach(btn => btn.classList.toggle('active', btn.dataset.route === route));
      document.getElementById('nav').classList.remove('open');
      history.replaceState(null, '', '#' + route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderHero() {
      document.getElementById('heroTitle').textContent = serverInfo.title || 'Erp 14';
      document.getElementById('heroSeason').textContent = serverInfo.season;
      document.getElementById('heroDescription').textContent = serverInfo.description;
      document.getElementById('heroServerNo').textContent = serverInfo.no;
      document.getElementById('heroServerIp').textContent = serverInfo.ip;
      document.getElementById('heroGroup').textContent = serverInfo.group;
      const joinLink = document.getElementById('joinGroupLink');
      joinLink.textContent = serverInfo.joinText || '加入玩家群';
      joinLink.href = serverInfo.joinUrl || '#';
      joinLink.title = serverInfo.joinApplication || '加入玩家群';
    }

    function renderNewPlayerGuide() {
      const ip = document.getElementById('guideServerIp');
      const group = document.getElementById('guideGroupNumber');

      if (ip) {
        ip.textContent = serverInfo.ip || '暂未配置';
      }

      if (group) {
        group.textContent = serverInfo.group || '暂未配置';
      }
    }

    let currentHeroSlide = 0;
    let heroTimer = null;
    let heroProgressTimer = null;
    let heroProgress = 0;
    const HERO_INTERVAL = 4500;

    function startHeroAutoPlay() {
      clearInterval(heroTimer);
      clearInterval(heroProgressTimer);
      heroProgress = 0;
      updateHeroProgress();

      heroTimer = setInterval(() => {
        const next = (currentHeroSlide + 1) % heroImages.length;
        showHeroSlide(next);
        heroProgress = 0;
        updateHeroProgress();
      }, HERO_INTERVAL);

      heroProgressTimer = setInterval(() => {
        heroProgress = Math.min(100, heroProgress + (100 / (HERO_INTERVAL / 100)));
        updateHeroProgress();
      }, 100);
    }

    function updateHeroProgress() {
      const bar = document.getElementById('heroProgressBar');
      if (bar) bar.style.width = heroProgress + '%';
    }

    function stopHeroAutoPlay() {
      clearInterval(heroTimer);
      clearInterval(heroProgressTimer);
    }

    function renderHeroCarousel() {
      const slides = document.getElementById('heroSlides');
      const dots = document.getElementById('heroDots');
      slides.innerHTML = heroImages.map((src, index) => `<div class="hero-slide ${index === 0 ? 'active' : ''}" style="background-image:url('${src}')"></div>`).join('');
      dots.innerHTML = heroImages.map((_, index) => `<button class="${index === 0 ? 'active' : ''}" data-slide="${index}" aria-label="切换到第 ${index + 1} 张图片"></button>`).join('');
      dots.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => showHeroSlide(Number(btn.dataset.slide))));
    }

    function showHeroSlide(index) {
      currentHeroSlide = index;
      heroProgress = 0;
      updateHeroProgress();
      document.querySelectorAll('.hero-slide').forEach((slide, i) => slide.classList.toggle('active', i === index));
      document.querySelectorAll('#heroDots button').forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    function renderPlay() {
      const showcase = document.getElementById('playShowcase');
      if (!playItems.length) {
        showcase.innerHTML = '<div class="card pad"><h3>暂无玩法内容</h3><p class="muted">等待后端配置。</p></div>';
        return;
      }
      showcase.innerHTML = playItems.map((item, index) => {
        const images = normalizePlayImages(item);
        const firstImage = images[0] || '';
        return `
        <article class="card play-card" data-play-card="${index}" data-image-index="0">
          <div class="play-media-wrap">
            <button class="play-card-media" type="button" data-open-image="${escapeAttr(firstImage)}" data-gallery="play-${index}" data-image-index="0" data-image-title="${escapeAttr(item.title)}" style="background-image:url('${escapeAttr(firstImage)}')"></button>
            ${images.length > 1 ? `<div class="template-controls"><button class="carousel-btn" type="button" data-play-control="prev" data-index="${index}">‹</button><button class="carousel-btn" type="button" data-play-control="next" data-index="${index}">›</button></div><span class="template-count">1 / ${images.length}</span>` : ''}
          </div>
          <div class="play-card-body">
            <div class="tag-row"><span class="tag green"><span data-icon="${escapeAttr(item.icon || 'map')}"></span>${escapeHtml(item.subtitle)}</span></div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text || item.description || '')}</p>
            <ul class="point-list">
              ${(item.points || []).map(point => `<li>${escapeHtml(point)}</li>`).join('')}
            </ul>
          </div>
        </article>`;
      }).join('');
      applyIcons(showcase);
    }

    function renderRequests() {
      const active = document.querySelector('#requestTabs button.active')?.dataset.status || 'pending';
      const activeCategory = document.querySelector('#requestCategoryFilters button.active')?.dataset.category || '';
      const q = document.getElementById('requestSearch').value.trim().toLowerCase();
      const label = { pending: '待讨论', done: '已完成', rejected: '已拒绝' };
      const cls = { pending: 'amber', done: 'green', rejected: 'danger' };
      const html = requests.map((item, index) => ({ item, index })).filter(({ item }) => {
        const frontStatus = normalizeRequestStatus(item.status);
        const frontCategory = normalizeRequestCategory(item.category || '');
        const haystack = (item.title + item.text + item.user + (item.category || '') + requestCategoryLabel(item.category || '') + (item.contact || '')).toLowerCase();
        return frontStatus === active && (!activeCategory || frontCategory === activeCategory) && haystack.includes(q);
      }).map(({ item, index }) => {
        const frontStatus = normalizeRequestStatus(item.status);
        const canVote = frontStatus === 'pending';
        const playerVote = canVote ? getPlayerVote(item, index) : '';
        const statusNote = frontStatus === 'done'
          ? `<div class="admin-note done">完成说明：${escapeHtml(item.adminReply || '已完成处理')}</div>`
          : frontStatus === 'rejected'
            ? `<div class="admin-note reject">拒绝原因：${escapeHtml(item.rejectReason || item.adminReply || '管理员未填写拒绝原因')}</div>`
            : (item.adminReply ? `<div class="admin-note">管理员回复：${escapeHtml(item.adminReply)}</div>` : '');
        const voteActions = canVote
          ? `<button class="mini-btn" data-action="vote-request" data-vote="agree" data-index="${index}" ${playerVote ? 'disabled' : ''}>${playerVote === 'agree' ? '已同意' : '同意'}</button>
              <button class="mini-btn" data-action="vote-request" data-vote="disagree" data-index="${index}" ${playerVote ? 'disabled' : ''}>${playerVote === 'disagree' ? '已否定' : '否定'}</button>`
          : '';
        return `
        <article class="request-card ${frontStatus}">
          <div class="request-head"><div><span class="tag ${cls[frontStatus]}">${label[frontStatus]}</span><span class="request-user"> ${escapeHtml(item.user)}</span></div><strong class="request-status-text ${frontStatus}">${label[frontStatus]}</strong></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
          ${Array.isArray(item.images) && item.images.length ? `<div class="request-images">${item.images.slice(0, 5).map(src => `<button class="request-thumb" type="button" data-open-image="${escapeAttr(src)}" data-gallery="request-${escapeAttr(item.title)}" data-image-index="${item.images.indexOf(src)}" data-image-title="${escapeAttr(item.title)}" style="background-image:url('${escapeAttr(src)}')"></button>`).join('')}</div>` : ''}
          <div class="tag-row"><span class="tag">提交人：${escapeHtml(item.user)}</span><span class="tag">${requestCategoryLabel(item.category || '')}</span><span class="tag">联系：${escapeHtml(item.contact || '未填写')}</span></div>
          <div class="vote-row">
            <span class="vote-counts" data-vote-count="${index}"><span>同意 <strong>${item.agree || 0}</strong></span><span>否定 <strong class="bad">${item.disagree || 0}</strong></span></span>
            <div class="vote-actions">
              ${voteActions}
              <button class="mini-btn" data-toast="讨论窗口已预留">讨论</button>
            </div>
          </div>
          ${statusNote}
        </article>`;
      }).join('');
      document.getElementById('requestGrid').innerHTML = html || '<div class="card pad">没有匹配的玩家建议。</div>';
    }

    function isFixedActivityVisible(item) {
      if (!item || item.published === false) return false;
      return inferActivityType(item) === 'fixed';
    }

    function buildActivityFields(item, isSignup) {
      const schedule = (!isSignup && item.schedule) ? item.schedule : '';
      const rules = item.rules || item.text || '';
      const reward = item.reward || '';
      const notes = item.notes || '';
      let html = '';
      if (schedule) {
        html += `<div class="activity-field activity-field-schedule"><span class="activity-field-icon" data-icon="clock"></span><span class="activity-field-label">开放时间</span><span class="activity-field-content">${escapeHtml(schedule)}</span></div>`;
      }
      if (rules) {
        html += `<div class="activity-field activity-field-rules"><span class="activity-field-icon" data-icon="clipboard"></span><span class="activity-field-label">内容/规则</span><span class="activity-field-content">${escapeHtml(rules)}</span></div>`;
      }
      if (reward) {
        html += `<div class="activity-field activity-field-reward"><span class="activity-field-icon" data-icon="gift"></span><span class="activity-field-label">奖励</span><span class="activity-field-content">${escapeHtml(reward)}</span></div>`;
      }
      if (notes) {
        html += `<div class="activity-field activity-field-notes"><span class="activity-field-icon" data-icon="chat"></span><span class="activity-field-label">备注</span><span class="activity-field-content">${escapeHtml(notes)}</span></div>`;
      }
      return html;
    }

    function renderActivitySignups() {
      const fixedBox = document.getElementById('fixedActivityList');
      const signupBox = document.getElementById('activitySignupList');
      if (!signupBox) return;
      const fixedVisible = updates.map((item, index) => ({ item, index })).filter(({ item }) => isFixedActivityVisible(item));
      const signupVisible = updates.map((item, index) => ({ item, index, id: getUpdateId(item, index) })).filter(({ item }) => isSignupVisible(item));

      if (fixedBox) {
        const fixedHtml = fixedVisible.length ? fixedVisible.map(({ item }) => `
        <article class="side-panel-item static">
          <span class="activity-badge activity-badge-fixed">常驻</span>
          <strong>${escapeHtml(item.title)}</strong>
          ${buildActivityFields(item, false)}
        </article>`).join('') : '<div class="signup-empty">暂无长期固定活动。</div>';
        fixedBox.innerHTML = fixedHtml;
      }

      const signupHtml = signupVisible.length ? signupVisible.map(({ item, index, id }) => `
        <article class="side-panel-item signup-item">
          <span class="activity-badge activity-badge-signup">可报名</span>
          <strong>${escapeHtml(item.title)}</strong>
          ${buildActivityFields(item, true)}
          <span class="signup-row"><span class="signup-count">已报 ${eventSignupCounts[id] || 0} 人</span><span class="signup-deadline">报名截止 ${escapeHtml(formatDateText(item.signupDeadline))}</span><span class="signup-cta" data-open-signup="${index}" role="button" tabindex="0">立即报名 →</span></span>
        </article>`).join('') : '<div class="signup-empty">当前没有开放报名的临时活动。</div>';
      signupBox.innerHTML = signupHtml;
      if (fixedBox) applyIcons(fixedBox);
      applyIcons(signupBox);
    }

    function setupActivityRailScroll() {
      // 原生横向滚动 — 鼠标滚轮/触控板/触摸/拖拽滚动条均可操作
    }

    function setupActivityAutoScroll() {
      const rails = document.querySelectorAll('.activity-rail');
      let timers = [];

      function scrollRail(rail) {
        const grid = rail.querySelector('.activity-grid');
        if (!grid) return;
        const maxScroll = grid.scrollWidth - grid.clientWidth;
        if (maxScroll <= 0) return;
        const nextLeft = grid.scrollLeft + 300;
        if (nextLeft >= maxScroll) {
          grid.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          grid.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }

      function startAll() {
        stopAll();
        rails.forEach(rail => {
          timers.push(setInterval(() => scrollRail(rail), 5000));
        });
      }

      function stopAll() {
        timers.forEach(t => clearInterval(t));
        timers = [];
      }

      rails.forEach(rail => {
        rail.addEventListener('mouseenter', stopAll);
        rail.addEventListener('mouseleave', startAll);
      });

      startAll();
    }

    function getActivityStatusBadge(item) {
      const activityType = inferActivityType(item);
      if (activityType === 'fixed') return '<span class="update-status-badge fixed">常驻</span>';
      const status = (item.status || '').trim();
      if (item.results && item.results.length > 0) return '<span class="update-status-badge rewarded">已颁奖</span>';
      if (status.includes('结束') || status.includes('已结束')) return '<span class="update-status-badge ended">已结束</span>';
      if (status.includes('进行') || status.includes('开始')) return '<span class="update-status-badge ongoing">进行中</span>';
      return '<span class="update-status-badge signup">报名中</span>';
    }

    function renderResultsTable(item) {
      if (!item.results || !item.results.length) return '';
      const rows = item.results.map(r => {
        const rankClass = r.rank === 1 ? 'rank-1' : r.rank === 2 ? 'rank-2' : r.rank === 3 ? 'rank-3' : '';
        const rankText = r.rank ? r.rank : '-';
        return `<tr class="${rankClass}"><td class="rank-num">${rankText}</td><td>${escapeHtml(r.player || '')}</td><td>${escapeHtml(r.score || '')}</td><td class="reward-cell">${escapeHtml(r.reward || '')}</td></tr>`;
      }).join('');
      const footer = item.rewardDate ? `<div class="activity-results-footer">已发奖 · ${escapeHtml(item.rewardDate)}</div>` : '';
      return `<div class="activity-results"><div class="activity-results-head">排名与奖励</div><table class="activity-results-table"><thead><tr><th>排名</th><th>玩家</th><th>成绩</th><th>奖励</th></tr></thead><tbody>${rows}</tbody></table>${footer}</div>`;
    }

    function renderUpdates() {
      const html = updates.map(item => {
        const isSignup = inferActivityType(item) === 'signup';
        return `
        <article class="update-card card">
          <div class="update-card-head">
            <h3>${escapeHtml(item.title)}</h3>
            ${getActivityStatusBadge(item)}
          </div>
          <div class="update-card-fields">${buildActivityFields(item, isSignup)}</div>
          ${renderResultsTable(item)}
        </article>`;
      }).join('');
      const box = document.getElementById('updateList');
      box.innerHTML = html;
      applyIcons(box);
    }

    async function loadEventSignupCounts() {
      try {
        // 从 events API 获取活动列表（含报名数）
        const data = await fetchWithFallback(EVENTS_URL);
        const eventsList = Array.isArray(data) ? data : (data.data || []);
        eventSignupCounts = {};
        eventsList.forEach(e => {
          const id = e.id || e.update_id;
          if (id != null) eventSignupCounts[`evt_${id}`] = (e.signup_count || e.signupCount || 0);
        });
        renderActivitySignups();
      } catch (error) {
        console.info('Event signup counts not loaded:', error.message);
      }
    }

    async function loadAdminEventSignups() {
      if (!adminToken) return;
      try {
        const data = await fetchJson(backendUrl('/api/admin/signups'), {
          headers: { authorization: `Bearer ${adminToken}` },
          cache: 'no-store'
        });
        // 按 event_id 分组
        const grouped = {};
        const signupsList = Array.isArray(data) ? data : (data.signups || data.items || []);
        signupsList.forEach(s => {
          const eid = `evt_${s.event_id}`;
          if (!grouped[eid]) grouped[eid] = [];
          grouped[eid].push(s);
        });
        eventSignupDetails = grouped;
        // 更新计数
        Object.entries(grouped).forEach(([eid, list]) => {
          eventSignupCounts[eid] = list.length;
        });
        renderActivitySignups();
        const activePanel = document.querySelector('[data-panel].active')?.dataset.panel;
        if (activePanel === 'updateManage') renderPanel('updateManage');
      } catch (error) {
        console.info('Admin event signups not loaded:', error.message);
      }
    }

    function openEventSignup(index) {
      const item = updates[index];
      if (!item || !isSignupVisible(item)) {
        showToast('这个活动暂未开放报名', 'info');
        return;
      }
      activeSignupEventId = getUpdateId(item, index);
      document.getElementById('signupModalTitle').textContent = item.title;
      document.getElementById('signupModalText').textContent = `报名截止：${formatDateText(item.signupDeadline)}`;
      document.getElementById('signupPlayerName').value = activePlayerName || '';
      document.getElementById('signupNote').value = '';
      document.getElementById('signupSubmitHint').textContent = '';
      document.getElementById('eventSignupModal').classList.add('show');
      document.getElementById('eventSignupModal').removeAttribute('hidden');
    }

    function closeEventSignup() {
      activeSignupEventId = '';
      document.getElementById('eventSignupModal').classList.remove('show');
      document.getElementById('eventSignupModal').setAttribute('hidden', '');
      document.getElementById('eventSignupForm').reset();
    }

    async function submitEventSignup(event) {
      event.preventDefault();
      const playerName = document.getElementById('signupPlayerName').value.trim();
      const note = document.getElementById('signupNote').value.trim();
      if (!activeSignupEventId || playerName.length < 2) {
        document.getElementById('signupSubmitHint').textContent = '请填写至少 2 个字的玩家名称';
        return;
      }
      try {
        // 新接口：POST /api/events/:id/signup
        let eventIdNum = parseInt(activeSignupEventId.replace('evt_', ''));
        // 如果 ID 不是数字（如硬编码的 weekend-airdrop），尝试按标题查找
        if (isNaN(eventIdNum)) {
          const item = updates.find(u => getUpdateId(u) === activeSignupEventId);
          if (item && item.id && !isNaN(parseInt(item.id))) {
            eventIdNum = parseInt(item.id);
          }
        }
        if (isNaN(eventIdNum)) {
          document.getElementById('signupSubmitHint').textContent = '活动ID异常，无法报名';
          return;
        }
        const data = await fetchWithFallback(backendUrl(`/api/events/${eventIdNum}/signup`), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ playerName, note })
        });
        eventSignupCounts[activeSignupEventId] = data.count || ((eventSignupCounts[activeSignupEventId] || 0) + 1);
        if (playerName) {
          activePlayerName = playerName;
          localStorage.setItem('erp14-player-name', playerName);
        }
        closeEventSignup();
        renderActivitySignups();
        loadAdminEventSignups();
        showToast('报名已提交', 'success');
      } catch (error) {
        document.getElementById('signupSubmitHint').textContent = error.message && error.message !== 'SIGNUP_FAILED' ? error.message : '报名提交失败，请确认后端服务已启动';
      }
    }

    function updateRequestImagePreview() {
      const preview = document.getElementById('requestImagePreview');
      preview.innerHTML = pendingRequestImages.map((src, index) => `<span class="preview-thumb" style="background-image:url('${escapeAttr(src)}')"><button type="button" data-request-image-remove="${index}" aria-label="删除图片">×</button></span>`).join('');
    }

    function handleRequestImageFiles(files) {
      readImageFiles(files, 5, images => {
        pendingRequestImages = [...pendingRequestImages, ...images].slice(0, 5);
        updateRequestImagePreview();
        if (images.length) showToast(`已添加 ${images.length} 张建议图片`, 'success');
      });
    }

    function openRequestModal() {
      pendingRequestImages = [];
      document.getElementById('requestSubmitHint').textContent = '';
      document.querySelectorAll('#requestForm .field-error').forEach(el => el.classList.remove('field-error'));
      updateRequestImagePreview();
      document.getElementById('requestSubmitHint').textContent = '';
      document.getElementById('requestModal').classList.add('show');
      document.getElementById('requestModal').removeAttribute('hidden');
      document.getElementById('requestTitle').focus();
    }

    function closeRequestModal() {
      document.getElementById('requestModal').classList.remove('show');
      document.getElementById('requestModal').setAttribute('hidden', '');
      document.getElementById('requestForm').reset();
      pendingRequestImages = [];
      updateRequestImagePreview();
    }

    function submitRequest(event) {
      event.preventDefault();
      const title = document.getElementById('requestTitle').value.trim();
      const text = document.getElementById('requestText').value.trim();
      const category = document.getElementById('requestCategory').value;
      const contact = document.getElementById('requestContact').value.trim();
      document.querySelectorAll('#requestForm .field-error').forEach(el => el.classList.remove('field-error'));
      const missing = [];
      const mark = (id, label) => {
        const el = document.getElementById(id);
        el.classList.add('field-error');
        missing.push(label);
      };
      if (title.length < 2) mark('requestTitle', '建议标题');
      if (text.length < 6) mark('requestText', '建议内容');
      if (!category) mark('requestCategory', '分类');
      if (contact.length < 2) mark('requestContact', '联系方式');
      if (missing.length) {
        const message = `请填写：${missing.join('、')}`;
        document.getElementById('requestSubmitHint').textContent = message;
        showToast(message, 'error');
        return;
      }
      document.getElementById('requestSubmitHint').textContent = '';
      const newRequest = {
        status: 'pending',
        category,
        contact,
        images: [...pendingRequestImages],
        title,
        user: activePlayerName || '未登记玩家',
        text,
        agree: 0,
        disagree: 0,
        adminReply: '',
        rejectReason: ''
      };
      requests.unshift(newRequest);
      try {
        addLog('玩家提交建议', `${activePlayerName || '未登记玩家'} 提交了：${title}`, '建议', 'blue');
        saveLocalData();
        // 异步推送到后端（不阻塞 UI）
        fetch(backendUrl('/api/requests'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(newRequest)
        }).catch(() => {});
      } catch (error) {
        requests.shift();
        document.getElementById('requestSubmitHint').textContent = '图片数据过大，建议删除部分图片或压缩后再提交';
        showToast('图片数据过大，建议删除部分图片后再提交', 'info');
        return;
      }
      closeRequestModal();
      renderAll();
      switchRoute('requests');
      showToast('建议已提交到后台', 'success');
    }

    function saveVisibilitySettings() {
      const rows = [...document.querySelectorAll('[data-section-row]')];
      rows.forEach((row, index) => {
        const key = row.dataset.sectionRow;
        if (!siteSections[key]) return;
        siteSections[key].visible = Boolean(row.querySelector(`[data-section-visible="${key}"]`)?.checked);
        siteSections[key].order = (index + 1) * 10;
      });
      addLog('前台展示已调整', '后台更新了板块开关和拖拽排序。', '控制', 'blue');
      saveLocalData();
      renderAll();
      showToast('前台控制已保存', 'success');
    }

    function saveHomeRules() {
      serverRules.title = document.getElementById('editRulesTitle').value.trim() || serverRules.title;
      serverRules.description = document.getElementById('editRulesDescription').value.trim() || serverRules.description;
      serverRules.image = document.getElementById('editRulesImage').value.trim();
      serverRules.items = parseRows(document.getElementById('editRulesItems').value, parts => ({
        title: parts[0] || '注意事项',
        text: parts[1] || '',
        level: parts[2] || '注意'
      }));
      addLog('服务器注意事项已保存', '后台更新了首页服规内容。', '服规', 'amber');
      saveLocalData();
      renderAll();
      showToast('服务器注意事项已保存', 'success');
    }

    function saveHomeHero() {
      serverInfo.title = document.getElementById('homeHeroTitle').value.trim() || serverInfo.title || 'Erp 14';
      serverInfo.season = document.getElementById('homeHeroSeason').value.trim() || serverInfo.season;
      serverInfo.description = document.getElementById('homeHeroDescription').value.trim() || serverInfo.description;
      addLog('首页主视觉已保存', '后台更新了首页大标题、状态文字和介绍。', '首页', 'green');
      saveLocalData();
      renderAll();
      renderPanel('homeManage');
      showToast('首页主视觉已保存', 'success');
    }

    function saveHomeFeatures() {
      homeFeatures.title = document.getElementById('editFeaturesTitle').value.trim() || homeFeatures.title;
      homeFeatures.description = document.getElementById('editFeaturesDescription').value.trim() || homeFeatures.description;
      homeFeatures.items = parseRows(document.getElementById('editHomeFeatures').value, parts => ({
        icon: parts[0] || 'shield',
        color: parts[1] || '',
        title: parts[2] || '特色',
        text: parts[3] || '',
        tags: (parts[4] || '').split(',').map(tag => tag.trim()).filter(Boolean)
      }));
      addLog('首页特色已保存', '后台更新了首页特色卡片。', '首页', 'green');
      saveLocalData();
      renderAll();
      showToast('首页特色已保存', 'success');
    }

    function saveHomeStats() {
      homeStats = parseRows(document.getElementById('editHomeStats').value, parts => ({
        icon: parts[0] || 'shield',
        color: parts[1] || '',
        label: parts[2] || '数据',
        value: parts[3] || '-',
        note: parts[4] || ''
      }));
      addLog('首页数据卡已保存', '后台更新了首页数据展示。', '首页', 'green');
      saveLocalData();
      renderAll();
      showToast('首页数据卡已保存', 'success');
    }

    function saveGroupSettings() {
      serverInfo.joinText = document.getElementById('groupJoinText').value.trim() || '加入玩家群';
      serverInfo.joinUrl = document.getElementById('groupJoinUrl').value.trim() || '#';
      serverInfo.joinApplication = document.getElementById('groupJoinApplication').value.trim();
      serverInfo.joinQr = document.getElementById('groupJoinQr').value.trim();
      addLog('玩家群设置已保存', '后台更新了加入玩家群按钮、二维码和申请说明。', '玩家群', 'green');
      saveLocalData();
      renderAll();
      renderPanel('groupManage');
      showToast('玩家群设置已保存', 'success');
    }

    function saveServerSettings() {
      serverInfo.title = document.getElementById('editHeroTitle').value.trim() || serverInfo.title || 'Erp 14';
      serverInfo.season = document.getElementById('editSeason').value.trim() || serverInfo.season;
      serverInfo.no = document.getElementById('editServerNo').value.trim() || serverInfo.no;
      serverInfo.ip = document.getElementById('editServerIp').value.trim() || serverInfo.ip;
      serverInfo.group = document.getElementById('editGroup').value.trim() || serverInfo.group;
      serverInfo.joinText = document.getElementById('editJoinText').value.trim() || '加入玩家群';
      serverInfo.joinUrl = document.getElementById('editJoinUrl').value.trim() || '#';
      serverInfo.joinApplication = document.getElementById('editJoinApplication').value.trim();
      serverInfo.joinQr = serverInfo.joinQr || '';
      serverInfo.description = document.getElementById('editDescription').value.trim() || serverInfo.description;
      heroImages = document.getElementById('editHeroImages').value.split('\n').map(item => item.trim()).filter(Boolean);
      addLog('网站信息已保存', '后台更新了首页文字和轮播图。');
      saveLocalData();
      renderAll();
      showToast('网站信息已更新', 'success');
    }

    function saveBuildingTemplate(index) {
      const read = field => document.querySelector(`[data-template-field="${field}"][data-index="${index}"]`).value.trim();
      const images = splitImageLines(read('images'));
      buildingTemplates[index] = {
        title: read('title') || '未命名模板',
        price: read('price') || '价格待定',
        image: images[0] || '',
        images,
        description: read('description'),
        note: read('note'),
        onShelf: read('onShelf') !== 'false',
        stock: read('stock') || '不限',
        limit: read('limit') || '不限购',
        buyUrl: read('buyUrl') || '#'
      };
      addLog('建筑模板已保存', `后台更新了建筑模板：${buildingTemplates[index].title}`, '建筑', 'amber');
      saveLocalData();
      renderAll();
      renderPanel('templateManage');
      showToast('建筑模板已保存', 'success');
    }

    function renderImageLibraryPanel() {
      const totalSize = imageLibrary.reduce((sum, item) => sum + (item.size || 0), 0);
      return `
        <div class="panel-title">
          <h3>图片库</h3>
          <p>统一保存常用图片，支持批量删除和管理。</p>
          <span class="save-state" id="panelSaveState">${panelDirty ? '有未保存修改' : '已保存'}</span>
        </div>
        <!-- 存储概览 -->
        <div class="image-storage-info" style="padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:8px;margin-bottom:14px">
          共 <strong id="totalImageCount">${imageLibrary.length}</strong> 张图片，占用 <strong id="totalImageSize">${(totalSize / 1024 / 1024).toFixed(1)} MB</strong>
        </div>
        <!-- 上传区 -->
        <div class="card" style="margin-bottom:14px">
          <div class="panel-title" style="margin-bottom:8px"><h4>上传图片</h4></div>
          <p class="muted" style="margin-bottom:10px">支持 PNG / JPG / WebP / GIF，单张原图不超过 5MB。图片库最多建议 ${IMAGE_LIBRARY_MAX_ITEMS} 张。</p>
          <label class="btn btn-secondary upload-btn" style="display:inline-flex;align-items:center;gap:6px">📤 选择图片上传<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple data-action="upload-library-image"></label>
        </div>
        <!-- 管理工具栏 -->
        <div class="batch-toolbar" id="imageBatchToolbar" style="margin-bottom:12px">
          <label class="batch-select-all">
            <input type="checkbox" id="selectAllImages">
            <span>全选</span>
          </label>
          <span class="batch-count">已选 <strong id="selectedImageCount">0</strong> 张</span>
          <div class="batch-actions">
            <button class="btn-danger-ghost" id="batchDeleteImages">🗑️ 批量删除</button>
          </div>
        </div>
        <!-- 图片网格 -->
        <div class="image-library-grid" id="imageLibraryGrid">
          ${imageLibrary.length === 0
            ? '<div class="card pad" style="grid-column:1/-1;text-align:center;color:var(--text-muted);">暂无图片，请上传。</div>'
            : imageLibrary.map((item, index) => `
            <div class="library-item">
              <input type="checkbox" class="image-checkbox" data-id="${item.id || index}" data-index="${index}">
              <div class="library-thumb" style="background-image:url('${escapeAttr(item.src || item.url)}')"></div>
              <div class="library-name">${escapeHtml(item.name || '未命名')}</div>
              <div class="library-meta">${escapeHtml(item.createdAt || item.created_at || '')}${item.size ? ' · ' + formatBytes(item.size) : ''}</div>
              <div class="library-actions">
                <button class="mini-btn" style="background:color-mix(in srgb, var(--brand) 10%, var(--surface));border-color:var(--brand);color:var(--brand)" data-action="copy-image-url" data-url="${escapeAttr(item.src || item.url)}" data-index="${index}">📋 复制地址</button>
                <button class="mini-btn danger" data-action="delete-single-image" data-id="${item.id || index}" data-index="${index}">删除</button>
              </div>
            </div>`).join('')}
        </div>`;
    }

    // ---- 图片库 API 加载与批量操作 ----

    async function loadImageLibrary() {
      try {
        let items, total, totalSize;
        if (adminToken) {
          const response = await fetch('/api/admin/images', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (!response.ok) throw new Error('Failed to load images');
          const json = await response.json();
          items = json.data?.items || [];
          total = json.data?.total || 0;
          totalSize = json.data?.totalSize || 0;
        } else {
          items = imageLibrary || [];
          total = items.length;
          totalSize = items.reduce((s, it) => s + (it.size || 0), 0);
        }

        const countEl = document.getElementById('totalImageCount');
        const sizeEl = document.getElementById('totalImageSize');
        if (countEl) countEl.textContent = total || items.length;
        if (sizeEl) sizeEl.textContent = (totalSize / 1024 / 1024).toFixed(1) + ' MB';

        const grid = document.getElementById('imageLibraryGrid');
        if (!grid) return;
        if (items.length === 0) {
          grid.innerHTML = '<div class="card pad" style="grid-column:1/-1;text-align:center;color:var(--text-muted);">暂无图片，请上传。</div>';
        } else {
          grid.innerHTML = items.map(item => {
            const src = escapeAttr(item.url || item.src || '');
            const name = escapeHtml(item.name || '未命名');
            const meta = escapeHtml(item.created_at || item.createdAt || '');
            const sizeStr = item.size ? ' · ' + formatBytes(item.size) : '';
            const id = item.id || 0;
            return `
            <div class="library-item">
              <input type="checkbox" class="image-checkbox" data-id="${id}">
              <div class="library-thumb" style="background-image:url('${src}')"></div>
              <div class="library-name">${name}</div>
              <div class="library-meta">${meta}${sizeStr}</div>
              <div class="library-actions">
                <button class="mini-btn" style="background:color-mix(in srgb, var(--brand) 10%, var(--surface));border-color:var(--brand);color:var(--brand)" data-action="copy-image-url" data-url="${src}">📋 复制地址</button>
                <button class="mini-btn danger" data-action="delete-single-image" data-id="${id}">删除</button>
              </div>
            </div>`;
          }).join('');
        }
        initImageBatchSelection();
      } catch (error) {
        const grid = document.getElementById('imageLibraryGrid');
        if (grid) {
          grid.innerHTML = '<div class="card pad" style="grid-column:1/-1;text-align:center;color:var(--danger);">加载失败，请重试</div>';
        }
      }
    }

    function initImageBatchSelection() {
      const selectAll = document.getElementById('selectAllImages');
      const selectedCount = document.getElementById('selectedImageCount');
      if (!selectedCount) return;

      function updateCount() {
        const checked = document.querySelectorAll('.image-checkbox:checked').length;
        selectedCount.textContent = checked;
        if (selectAll) {
          const total = document.querySelectorAll('.image-checkbox').length;
          selectAll.checked = checked === total && checked > 0;
        }
      }

      if (selectAll) {
        selectAll.removeEventListener('change', selectAll._handler);
        selectAll._handler = function() {
          document.querySelectorAll('.image-checkbox').forEach(cb => cb.checked = this.checked);
          updateCount();
        };
        selectAll.addEventListener('change', selectAll._handler);
      }

      document.querySelectorAll('.image-checkbox').forEach(cb => {
        cb.removeEventListener('change', cb._handler);
        cb._handler = updateCount;
        cb.addEventListener('change', cb._handler);
      });
    }

    // 批量删除图片（通过面板点击事件代理）
    async function handleBatchDeleteImages() {
      const ids = Array.from(document.querySelectorAll('.image-checkbox:checked'))
        .map(cb => cb.dataset.id)
        .filter(Boolean);

      if (ids.length === 0) {
        showToast('请先选择要删除的图片', 'warning');
        return;
      }

      confirmAction('批量删除图片', `确定要删除选中的 ${ids.length} 张图片吗？此操作不可恢复。`, async () => {
        try {
          if (adminToken) {
            const response = await fetch(`/api/admin/images/batch?ids=${ids.join(',')}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Delete failed');
          }
          // 同时清理本地数据
          ids.forEach(id => {
            const idx = imageLibrary.findIndex(item => String(item.id) === String(id) || String(item.src) === String(id));
            if (idx !== -1) imageLibrary.splice(idx, 1);
          });
          saveLocalData();
          showToast(`成功删除 ${ids.length} 张图片`, 'success');
          loadImageLibrary();
        } catch (error) {
          showToast('删除失败，请重试', 'error');
        }
      });
    }

    function renderBackupPanel() {
      return `
        <div class="panel-title">
          <h3>备份恢复</h3>
          <p>按模块导出或导入数据，支持配置、建议、活动、报名、图片 5 个模块。</p>
          <span class="save-state" id="panelSaveState">${panelDirty ? '有未保存修改' : '已保存'}</span>
        </div>

        <!-- 安全提示 -->
        <div class="card pad" style="border-left:4px solid var(--amber);margin-bottom:16px">
          <p style="margin:0"><strong>⚠️ 安全提醒</strong></p>
          <p class="muted" style="margin:6px 0 0">
            普通代码更新不需要导入或重置数据，直接覆盖 HTML/JS 文件即可。<br>
            导入和重置会影响当前运营数据（玩家建议、活动、报名名单等），<strong>操作前会先自动备份当前数据</strong>。
          </p>
        </div>

        <!-- 导出区域 -->
        <div class="backup-section card pad">
          <div class="backup-section-header">
            <span class="backup-section-icon">📤</span>
            <div>
              <h4>导出数据</h4>
              <p class="muted">选择要导出的模块，生成 JSON 备份文件</p>
            </div>
          </div>
          <div class="backup-modules" id="exportModules">
            <label class="module-check"><input type="checkbox" checked value="config"> 网站配置</label>
            <label class="module-check"><input type="checkbox" checked value="requests"> 玩家建议</label>
            <label class="module-check"><input type="checkbox" checked value="events"> 活动数据</label>
            <label class="module-check"><input type="checkbox" checked value="signups"> 报名名单</label>
            <label class="module-check"><input type="checkbox" checked value="images"> 图片列表</label>
          </div>
          <button class="btn-primary" id="exportSelected">📥 导出选中模块</button>
        </div>

        <!-- 导入区域 -->
        <div class="backup-section card pad" style="margin-top:16px;">
          <div class="backup-section-header">
            <span class="backup-section-icon">📥</span>
            <div>
              <h4>导入数据</h4>
              <p class="muted">选择备份文件，勾选要覆盖的模块。导入前会<strong>自动备份当前数据</strong>。</p>
            </div>
          </div>
          <div class="backup-modules" id="importModules">
            <label class="module-check"><input type="checkbox" checked value="config"> 覆盖网站配置</label>
            <label class="module-check"><input type="checkbox" checked value="requests"> 覆盖玩家建议</label>
            <label class="module-check"><input type="checkbox" checked value="events"> 覆盖活动数据</label>
            <label class="module-check"><input type="checkbox" checked value="signups"> 覆盖报名名单</label>
            <label class="module-check"><input type="checkbox" checked value="images"> 覆盖图片列表</label>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;">
            <label class="btn-secondary upload-btn">
              📂 选择备份文件
              <input type="file" accept=".json" id="importBackupFile" style="display:none;">
            </label>
            <button class="btn-primary" id="importSelected">📥 导入选中模块</button>
          </div>
          <div id="importStatus" style="margin-top:10px;font-size:14px;color:var(--text-muted);"></div>
        </div>

        <!-- 重置区域 -->
        <div class="backup-section card pad" style="margin-top:16px;border-left:4px solid var(--danger);">
          <div class="backup-section-header">
            <span class="backup-section-icon">⚠️</span>
            <div>
              <h4 style="color:var(--danger);">恢复默认数据</h4>
              <p class="muted">恢复到本文件内置的默认内容，当前本地修改会被覆盖。<br>重置前会<strong>自动备份当前数据</strong>，并需要输入 <strong>"确认重置"</strong> 才能执行。</p>
            </div>
          </div>
          <button class="btn-danger" id="resetSiteData">🔄 一键恢复默认数据</button>
        </div>`;
    }

    // ===== 备份恢复功能 =====

    // 导出选中模块
    async function exportSelectedModules() {
      const modules = [];
      document.querySelectorAll('#exportModules .module-check input:checked').forEach(el => {
        modules.push(el.value);
      });

      if (modules.length === 0) {
        showToast('请至少选择一个模块', 'warning');
        return;
      }

      try {
        const response = await fetch(`/api/admin/export?modules=${modules.join(',')}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!response.ok) throw new Error('Export failed');
        const json = await response.json();

        // 下载 JSON 文件
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${modules.join('_')}_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('导出成功', 'success');
      } catch (error) {
        showToast('导出失败，请重试', 'error');
      }
    }

    // 导入选中模块
    async function importSelectedModules() {
      const fileInput = document.getElementById('importBackupFile');
      const file = fileInput.files[0];
      if (!file) {
        showToast('请先选择备份文件', 'warning');
        return;
      }

      const modules = [];
      document.querySelectorAll('#importModules .module-check input:checked').forEach(el => {
        modules.push(el.value);
      });

      if (modules.length === 0) {
        showToast('请至少选择一个要导入的模块', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          // 先自动备份当前数据
          if (!autoBackupForSafety('导入')) return;

          // 模块中文名映射（确认弹窗展示）
          const moduleLabels = { config: '网站配置', requests: '玩家建议', events: '活动数据', signups: '报名名单', images: '图片列表' };
          const moduleNames = modules.map(m => moduleLabels[m] || m);
          const confirmMsg = '即将导入以下模块，当前数据将被覆盖：\n\n' +
            moduleNames.join('\n') +
            '\n\n⚠️ 已先自动备份当前数据，如需回退请使用备份文件。';

          confirmAction('导入数据 — 覆盖确认', confirmMsg, async () => {
            try {
              const response = await fetch('/api/admin/import', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${adminToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ modules, data })
              });
              if (!response.ok) throw new Error('Import failed');
              const result = await response.json();
              document.getElementById('importStatus').textContent = `✅ 导入成功：${result.message}`;
              showToast('导入成功', 'success');
              // 刷新页面数据
              renderAll();
            } catch (error) {
              document.getElementById('importStatus').textContent = '❌ 导入失败：' + error.message;
              showToast('导入失败，请重试', 'error');
            }
          });
        } catch (error) {
          showToast('文件格式错误，请选择有效的 JSON 备份文件', 'error');
        }
      };
      reader.readAsText(file);
    }

    function saveRequestChanges() {
      const changedIds = [];
      document.querySelectorAll('[data-request-status]').forEach(select => {
        const index = Number(select.dataset.requestStatus);
        if (requests[index]) {
          requests[index].status = select.value;
          changedIds.push(requests[index].id);
        }
      });
      document.querySelectorAll('[data-request-reply]').forEach(input => {
        const index = Number(input.dataset.requestReply);
        if (requests[index]) requests[index].adminReply = input.value.trim();
      });
      document.querySelectorAll('[data-request-reason]').forEach(input => {
        const index = Number(input.dataset.requestReason);
        if (requests[index]) requests[index].rejectReason = input.value.trim();
      });
      addLog('建议状态已保存', '后台保存了建议状态、回复和拒绝原因。', '建议', 'blue');
      saveLocalData();
      // 异步推送到后端
      if (adminToken) {
        changedIds.forEach(id => {
          const item = requests.find(r => r.id === id);
          if (!item) return;
          fetch(backendUrl(`/api/admin/requests/${id}`), {
            method: 'PUT',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
              title: item.title,
              content: item.text,
              category: item.category,
              status: item.status,
              user: item.user,
              contact: item.contact,
              agree: item.agree,
              disagree: item.disagree,
              adminReply: item.adminReply,
              rejectReason: item.rejectReason
            })
          }).catch(() => {});
        });
      }
      renderAll();
      renderPanel('requestManage');
      showToast('建议修改已保存', 'success');
    }

    function savePlayItem(index) {
      const read = field => document.querySelector(`[data-play-field="${field}"][data-index="${index}"]`).value.trim();
      playItems[index] = {
        key: read('key') || `play-${Date.now()}`,
        icon: read('icon') || 'map',
        title: read('title') || '未命名玩法',
        subtitle: read('subtitle'),
        image: (read('images').split('\n').map(item => item.trim()).filter(Boolean)[0] || read('image')),
        images: read('images').split('\n').map(item => item.trim()).filter(Boolean),
        text: read('text'),
        points: read('points').split('\n').map(item => item.trim()).filter(Boolean)
      };
      addLog('玩法已保存', `后台更新了玩法：${playItems[index].title}`);
      saveLocalData();
      // 异步同步到后端
      if (adminToken) {
        const item = playItems[index];
        const payload = {
          key: item.key,
          icon: item.icon,
          title: item.title,
          subtitle: item.subtitle || '',
          description: item.text || '',
          points: item.points || [],
          images: item.images || []
        };
        fetch(backendUrl('/api/admin/plays'), {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
      renderAll();
      showToast('玩法已保存', 'success');
    }

    async function saveUpdateItem(index) {
      const read = field => { const el = document.querySelector(`[data-update-field="${field}"][data-index="${index}"]`); return el ? el.value.trim() : ''; };
      const checked = field => Boolean(document.querySelector(`[data-update-check="${field}"][data-index="${index}"]`)?.checked);
      const tbody = document.getElementById(`resultsBody-${index}`);
      const resultRows = tbody ? tbody.querySelectorAll('tr[data-results-row]') : [];
      const results = Array.from(resultRows).map(tr => {
        const rankVal = (tr.querySelector('[data-results-rank]')?.value || '').trim();
        const rank = parseInt(rankVal, 10);
        return { rank: isNaN(rank) ? null : rank, player: (tr.querySelector('[data-results-player]')?.value || '').trim(), score: (tr.querySelector('[data-results-score]')?.value || '').trim(), reward: (tr.querySelector('[data-results-reward]')?.value || '').trim() };
      }).filter(r => r.player || r.score || r.reward);
      const selectEl = document.querySelector(`[data-update-field="activityType-select"][data-index="${index}"]`);
      const activityType = selectEl ? (selectEl.value === 'signup' ? 'signup' : 'fixed') : read('activityType');
      const oldItem = updates[index] || {};
      const isNew = String(oldItem.id || '').startsWith('event-') || isNaN(parseInt(oldItem.id));
      const newItem = {
        ...oldItem,
        id: getUpdateId(oldItem, index),
        version: read('version') || '公告',
        status: read('status') || '已发布',
        title: read('title') || '未命名活动',
        text: read('rules'),
        rules: read('rules'),
        schedule: read('schedule') || '',
        reward: read('reward') || '',
        notes: read('notes') || '',
        results: results,
        rewardDate: read('rewardDate') || '',
        activityType: activityType,
        published: checked('published'),
        signupEnabled: activityType === 'signup' && checked('signupEnabled'),
        signupDeadline: activityType === 'signup' ? read('signupDeadline') : '',
        eventEndAt: activityType === 'signup' ? read('eventEndAt') : ''
      };
      updates[index] = newItem;

      // 同步到后端
      if (adminToken) {
        try {
          const payload = {
            title: newItem.title,
            type: newItem.activityType,
            status: newItem.status,
            content: newItem.text || newItem.rules || '',
            schedule: newItem.schedule,
            reward: newItem.reward,
            signup_deadline: newItem.signupDeadline || null,
            event_end_at: newItem.eventEndAt || null,
            results: newItem.results || [],
            reward_date: newItem.rewardDate || null,
            published: newItem.published,
            notes: newItem.notes || ''
          };
          let resp;
          if (isNew) {
            resp = await fetch(backendUrl('/api/admin/events'), {
              method: 'POST',
              headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
              body: JSON.stringify(payload)
            });
          } else {
            resp = await fetch(backendUrl(`/api/admin/events/${oldItem.id}`), {
              method: 'PUT',
              headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
              body: JSON.stringify(payload)
            });
          }
          if (resp.ok) {
            const json = await resp.json();
            if (isNew && json.data?.id) {
              // 新活动返回数据库ID，替换本地临时ID
              updates[index].id = json.data.id;
            }
          } else {
            console.warn('活动同步到后端失败:', resp.status, await resp.text());
          }
        } catch (error) {
          console.warn('活动同步请求失败:', error.message);
        }
      }

      addLog('活动已保存', `后台更新了活动：${newItem.title}`, '活动', 'amber');
      saveLocalData();
      renderAll();
      showToast('活动已保存', 'success');
    }

    function moveItem(list, index, direction) {
      const target = index + direction;
      if (target < 0 || target >= list.length) return false;
      [list[index], list[target]] = [list[target], list[index]];
      return true;
    }

    function voteRequest(index, type) {
      const item = requests[index];
      if (!item) return;
      if (normalizeRequestStatus(item.status) !== 'pending') {
        showToast('已完成和已拒绝建议仅展示，不支持投票', 'info');
        renderRequests();
        return;
      }
      const voter = getCurrentVoterName();
      if (!voter) {
        showToast('请先填写游戏内名称再投票', 'warning');
        return;
      }
      const requestId = getRequestId(item, index);
      requestVotes[requestId] = requestVotes[requestId] || {};
      if (requestVotes[requestId][voter]) {
        showToast('你已经投过票了', 'warning');
        renderRequests();
        return;
      }
      requestVotes[requestId][voter] = type;
      if (type === 'agree') item.agree = Number(item.agree || 0) + 1;
      if (type === 'disagree') item.disagree = Number(item.disagree || 0) + 1;
      saveLocalData();
      renderRequests();
      renderHomeSuggestions();
      showToast(type === 'agree' ? '已记录同意' : '已记录否定', 'info');
    }

    function downloadTextFile(filename, text) {
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }

    function exportSiteData() {
      downloadTextFile(`erp14-site-backup-${Date.now()}.json`, JSON.stringify(getSiteDataSnapshot(), null, 2));
      showToast('配置已导出', 'info');
    }

    function applyImportedSiteData(data) {
      heroImages = mergeArray(heroImages, data.heroImages);
      serverInfo = mergeObject(serverInfo, data.serverInfo);
      playItems = mergeArray(playItems, data.playItems);
      requests = mergeArray(requests, data.requests);
      updates = mergeArray(updates, data.updates);
      siteSections = mergeObject(siteSections, data.siteSections);
      normalizeSiteSections();
      homeStats = mergeArray(homeStats, data.homeStats);
      homeFeatures = mergeObject(homeFeatures, data.homeFeatures);
      serverRules = mergeObject(serverRules, data.serverRules);
      playerSessions = mergeArray(playerSessions, data.playerSessions);
      buildingTemplates = mergeArray(buildingTemplates, data.buildingTemplates);
      logs = mergeArray(logs, data.logs);
      imageLibrary = mergeArray(imageLibrary, data.imageLibrary);
      saveLocalData();
      renderAll();
    }

    function importSiteDataFromText() {
      try {
        const data = JSON.parse(document.getElementById('importSiteDataText').value);
        applyImportedSiteData(data);
        showToast('备份已导入', 'success');
      } catch (error) {
        markPanelFailed('导入失败，JSON 格式不正确');
        showToast('导入失败，JSON 格式不正确', 'error');
      }
    }

    async function resetSiteData() {
      // 第 0 步：先自动备份当前数据
      if (!autoBackupForSafety('重置')) return;

      // 第 1 步：常规确认弹窗
      const ok1 = await confirmAction('恢复默认数据', '即将恢复默认数据，当前所有本地修改将丢失。\n\n已先自动备份当前数据，备份文件已下载。\n\n点击"确定"后还需输入"确认重置"以执行。');
      if (!ok1) return;

      // 第 2 步：要求输入"确认重置"才能执行
      const ok2 = await promptConfirmAction('确认重置', '请输入"确认重置"以执行恢复默认数据操作。此操作不可直接撤销。', '确认重置');
      if (!ok2) return;

      localStorage.removeItem('erp14-site-data');
      location.reload();
    }

    async function handlePanelAction(action, index, event) {
      if (action === 'vote-request') {
        voteRequest(index, event?.target?.dataset.vote || 'agree');
      }
      if (action === 'remove-managed-image') {
        const button = event?.target?.closest('[data-action]');
        removeManagedImage(button?.dataset.imageTarget || '', button?.dataset.ownerIndex || '', Number(button?.dataset.imageIndex));
      }
      if (action === 'move-managed-image') {
        const button = event?.target?.closest('[data-action]');
        moveManagedImage(button?.dataset.imageTarget || '', button?.dataset.ownerIndex || '', Number(button?.dataset.imageIndex), Number(button?.dataset.direction));
      }
      if (action === 'select-library-image') {
        const button = event?.target?.closest('[data-action="select-library-image"]');
        event?.preventDefault();
        event?.stopPropagation();
        selectLibraryImage(button?.dataset.imageTarget || '', button?.dataset.ownerIndex || '', Number(button?.dataset.libraryIndex), button?.dataset.single === 'true');
      }
      if (action === 'copy-image-url') {
        const btn = event?.target?.closest('[data-action="copy-image-url"]');
        const url = btn?.dataset?.url;
        if (url) {
          navigator.clipboard?.writeText(url).then(() => {
            showToast('图片地址已复制', 'success');
          }).catch(() => {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            input.remove();
            showToast('图片地址已复制', 'success');
          });
        }
      }
      if (action === 'delete-single-image') {
        const btn = event?.target?.closest('[data-action="delete-single-image"]');
        const id = btn?.dataset?.id;
        const idx = Number(btn?.dataset?.index);

        confirmAction('删除图片', '确定要删除这张图片吗？', async () => {
          try {
            if (adminToken && !isNaN(Number(id)) && Number(id) > 0) {
              const response = await fetch(`/api/admin/images/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
              });
              if (!response.ok) throw new Error('Delete failed');
            }
            // 同时清理本地数据
            if (idx >= 0 && idx < imageLibrary.length) {
              imageLibrary.splice(idx, 1);
            } else if (id && !isNaN(Number(id))) {
              const li = imageLibrary.findIndex(item => String(item.id) === String(id));
              if (li !== -1) imageLibrary.splice(li, 1);
            }
            saveLocalData();
            showToast('图片已删除', 'success');
            loadImageLibrary();
          } catch (error) {
            showToast('删除失败，请重试', 'error');
          }
        });
      }
      if (action === 'view-request') {
        const item = requests[index];
        if (item) alert(`建议：${item.title}
提交人：${item.user}
分类：${item.category || '优化'}
联系方式：${item.contact || '未填写'}
图片数量：${Array.isArray(item.images) ? item.images.length : 0}
状态：${requestLabel(item.status)}
管理员回复：${item.adminReply || '无'}
拒绝原因：${item.rejectReason || '无'}

${item.text}`);
      }
      if (action === 'move-request-up' && moveItem(requests, index, -1)) {
        saveLocalData();
        renderAll();
        renderPanel('requestManage');
      }
      if (action === 'move-request-down' && moveItem(requests, index, 1)) {
        saveLocalData();
        renderAll();
        renderPanel('requestManage');
      }
      if (action === 'delete-request') {
        const ok = await confirmAction('删除建议', '确定要删除这条建议吗？');
        if (!ok) return;
        const [removed] = requests.splice(index, 1);
        addLog('建议已删除', removed.title, '建议', 'red');
        saveLocalData();
        renderAll();
        renderPanel('requestManage');
      }
      if (action === 'add-template') {
        buildingTemplates.unshift({ title: '新建筑模板', price: '价格待定', image: heroImages[0] || '', images: heroImages[0] ? [heroImages[0]] : [], description: '请填写模板介绍。', note: '备注待补充。', onShelf: true, stock: '不限', limit: '不限购', buyUrl: '#' });
        saveLocalData();
        renderPanel('templateManage');
      }
      if (action === 'move-template-up' && moveItem(buildingTemplates, index, -1)) {
        saveLocalData();
        renderAll();
        renderPanel('templateManage');
      }
      if (action === 'move-template-down' && moveItem(buildingTemplates, index, 1)) {
        saveLocalData();
        renderAll();
        renderPanel('templateManage');
      }
      if (action === 'save-template') saveBuildingTemplate(index);
      if (action === 'delete-template') {
        const ok = await confirmAction('删除模板', '确定要删除这个建筑模板吗？');
        if (!ok) return;
        const [removed] = buildingTemplates.splice(index, 1);
        addLog('建筑模板已删除', removed.title, '建筑', 'red');
        saveLocalData();
        renderAll();
        renderPanel('templateManage');
      }
      if (action === 'add-play') {
        playItems.push({ key: `play-${Date.now()}`, icon: 'map', title: '新玩法', subtitle: '后台新增玩法', image: heroImages[0] || '', images: heroImages[0] ? [heroImages[0]] : [], text: '请填写玩法说明。', points: ['要点一'] });
        saveLocalData();
        renderPanel('playManage');
      }
      if (action === 'move-play-up' && moveItem(playItems, index, -1)) {
        saveLocalData();
        renderAll();
        renderPanel('playManage');
      }
      if (action === 'move-play-down' && moveItem(playItems, index, 1)) {
        saveLocalData();
        renderAll();
        renderPanel('playManage');
      }
      if (action === 'save-play') savePlayItem(index);
      if (action === 'delete-play' && playItems.length > 1) {
        const ok = await confirmAction('删除玩法', '确定要删除这个玩法吗？');
        if (!ok) return;
        const [removed] = playItems.splice(index, 1);
        addLog('玩法已删除', removed.title, '玩法', 'red');
        saveLocalData();
        renderAll();
      }
      if (action === 'add-update') {
        const type = event.target.dataset.type || 'signup';
        updates.unshift({ id: `event-${Date.now()}`, activityType: type, version: '活动', status: type === 'signup' ? '报名中' : '常驻', title: type === 'signup' ? '新临时活动' : '新固定活动', text: '请填写活动内容。', published: true, signupEnabled: type === 'signup', signupDeadline: '', eventEndAt: '' });
        saveLocalData();
        renderPanel('updateManage');
      }
      if (action === 'move-update-up' && moveItem(updates, index, -1)) {
        saveLocalData();
        renderAll();
        renderPanel('updateManage');
      }
      if (action === 'move-update-down' && moveItem(updates, index, 1)) {
        saveLocalData();
        renderAll();
        renderPanel('updateManage');
      }
      if (action === 'save-update') {
        await saveUpdateItem(index);
        return;
      }
      if (action === 'manual-signup') {
        const nameInput = document.querySelector(`[data-manual-signup-name][data-index="${index}"]`);
        const noteInput = document.querySelector(`[data-manual-signup-note][data-index="${index}"]`);
        if (!nameInput) return;
        const playerName = nameInput.value.trim();
        if (!playerName || playerName.length < 2) { showToast('请输入至少2个字符的玩家名', 'warning'); return; }
        const note = noteInput ? noteInput.value.trim() : '';
        const eventId = getUpdateId(updates[index], index);
        let eventIdNum = parseInt(eventId.replace('evt_', ''));
        if (isNaN(eventIdNum)) {
          const item = updates[index];
          if (item && item.id && !isNaN(parseInt(item.id))) eventIdNum = parseInt(item.id);
        }
        if (isNaN(eventIdNum)) { showToast('活动ID异常，无法手动报名', 'error'); return; }
        fetch(backendUrl(`/api/admin/signups`), {
          method: 'POST', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ event_id: eventIdNum, playerName, note })
        }).then(r => r.json()).then(resp => {
          const data = resp.data || resp;
          if (resp.code === 200 || resp.code === 201 || data.id) { showToast('已手动添加报名', 'info'); nameInput.value = ''; if (noteInput) noteInput.value = ''; loadAdminEventSignups(); renderPanel('updateManage'); }
          else { showToast(data.message || resp.message || data.error || '添加失败'); }
        }).catch(() => showToast('添加失败，请确认后端已启动', 'error'));
      }
      if (action === 'import-signups-to-results') {
        const eventId = getUpdateId(updates[index], index);
        const signups = eventSignupDetails[eventId] || [];
        if (!signups.length) { showToast('暂无报名名单', 'warning'); return; }
        const tbody = document.getElementById(`resultsBody-${index}`);
        if (!tbody) return;
        signups.forEach(p => {
          const tr = document.createElement('tr');
          tr.setAttribute('data-results-row', tbody.children.length);
          tr.innerHTML = '<td><input class="rank-input" data-results-rank placeholder="-"></td><td><input data-results-player placeholder="玩家名"></td><td><input data-results-score placeholder="成绩"></td><td><input data-results-reward placeholder="奖励"></td><td><button class="del-btn" type="button" data-action="del-result-row" data-index="' + index + '">×</button></td>';
          tr.querySelector('[data-results-player]').value = p.playerName || '';
          tr.querySelector('[data-results-reward]').value = '参与奖';
          tbody.appendChild(tr);
        });
        showToast(`已导入 ${signups.length} 名报名玩家`, 'success');
      }
      if (action === 'add-result-row') {
        const tbody = document.getElementById(`resultsBody-${index}`);
        if (!tbody) return;
        const tr = document.createElement('tr');
        tr.setAttribute('data-results-row', tbody.children.length);
        tr.innerHTML = '<td><input class="rank-input" data-results-rank placeholder="-"></td><td><input data-results-player placeholder="玩家名"></td><td><input data-results-score placeholder="成绩"></td><td><input data-results-reward placeholder="奖励"></td><td><button class="del-btn" type="button" data-action="del-result-row" data-index="' + index + '">×</button></td>';
        tbody.appendChild(tr);
      }
      if (action === 'del-result-row') {
        const tr = event.target.closest('tr[data-results-row]');
        if (tr) tr.remove();
      }
      if (action === 'publish-results') {
        const statusInput = document.querySelector(`[data-update-field="status"][data-index="${index}"]`);
        if (statusInput) statusInput.value = '已颁奖';
        const rewardDateInput = document.querySelector(`[data-update-field="rewardDate"][data-index="${index}"]`);
        if (rewardDateInput && !rewardDateInput.value) {
          const today = new Date();
          rewardDateInput.value = today.toISOString().slice(0, 10);
        }
        document.querySelectorAll(`[data-status-select][data-index="${index}"]`).forEach(btn => {
          btn.classList.toggle('active', btn.dataset.statusSelect === '已颁奖');
        });
        showToast('已设为已颁奖，点击保存生效', 'info');
      }
      if (action === 'end-event') {
        const ok = await confirmAction('结束活动', '结束活动后状态将变为「已结束」，确定继续吗？');
        if (!ok) return;
        const statusInput = document.querySelector(`[data-update-field="status"][data-index="${index}"]`);
        if (statusInput) statusInput.value = '已结束';
        if (updates[index]) updates[index].status = '已结束';
        document.querySelectorAll(`[data-status-select][data-index="${index}"]`).forEach(btn => {
          btn.classList.toggle('active', btn.dataset.statusSelect === '已结束');
        });
        addLog('活动已结束', `结束了活动「${updates[index]?.title || ''}」`, '活动', 'amber');
        // addLog 已内部调用 saveLocalData()
        renderAll();
        showToast('活动已结束', 'success');
      }
      if (action === 'import-signups') {
        const eventId = getUpdateId(updates[index], index);
        const signups = eventSignupDetails[eventId] || [];
        if (!signups.length) { showToast('暂无报名名单', 'warning'); return; }
        const tbody = document.getElementById(`resultsBody-${index}`);
        if (!tbody) return;
        signups.forEach(p => {
          const tr = document.createElement('tr');
          tr.setAttribute('data-results-row', tbody.children.length);
          tr.innerHTML = '<td><input class="rank-input" data-results-rank placeholder="-"></td><td><input data-results-player placeholder="玩家名"></td><td><input data-results-score placeholder="成绩"></td><td><input data-results-reward placeholder="奖励"></td><td><button class="del-btn" type="button" data-action="del-result-row" data-index="' + index + '">×</button></td>';
          tr.querySelector('[data-results-player]').value = p.playerName || '';
          tr.querySelector('[data-results-reward]').value = '参与奖';
          tbody.appendChild(tr);
        });
        showToast(`已导入 ${signups.length} 名报名玩家到结果`, 'success');
      }
      if (action === 'duplicate-update') {
        const src = updates[index];
        if (!src) return;
        const copy = { ...src, id: undefined, title: (src.title || '新活动') + '（副本）', status: '报名中', results: [], rewardDate: '' };
        updates.splice(index + 1, 0, copy);
        addLog('活动已复制', `从「${src.title}」复制为新一期`, '活动', 'amber');
        saveLocalData();
        renderAll();
        renderPanel('updateManage');
        showToast('已复制为新一期', 'success');
      }
      if (action === 'delete-update') {
        const ok = await confirmAction('删除活动', '确定要删除这个活动吗？');
        if (!ok) return;
        const [removed] = updates.splice(index, 1);
        addLog('活动已删除', removed.title, '活动', 'red');
        saveLocalData();
        renderAll();
      }
    }

    function handlePanelFileAction(input) {
      const action = input.dataset.action;
      const index = Number(input.dataset.index);
      if (action === 'upload-library-image') {
        const room = Math.max(0, IMAGE_LIBRARY_MAX_ITEMS - imageLibrary.length);
        if (!room) {
          showToast(`图片库最多保留 ${IMAGE_LIBRARY_MAX_ITEMS} 张，请先删除旧图`, 'warning');
          return;
        }
        // 保存原始文件名（浏览器 File 对象中的原始中文名）
        const uploadedFiles = Array.from(input.files).slice(0, Math.min(room, 30));
        if (adminToken) {
          uploadImageFilesToBackend(input.files, Math.min(room, 30)).then(images => {
            if (!images.length) return;
            uploadedFiles.forEach((file, i) => {
              if (images[i]) imageLibrary.unshift({ src: images[i], name: file.name, createdAt: nowText() });
            });
            saveLocalData();
            renderPanel('imageLibrary');
            showToast(`已上传 ${images.length} 张图片到后端图片库`, 'success');
          }).catch(() => {
            showToast('上传到后端失败，请确认本地后端已启动', 'error');
          });
          return;
        }
        readImageFiles(input.files, Math.min(room, 30), images => {
          if (!images.length) return;
          const estimatedNextSize = estimateSiteStorageBytes() + images.join('').length * 2;
          if (estimatedNextSize > IMAGE_STORAGE_HARD_LIMIT) {
            showToast('图片太多，可能导致本地保存失败，请删除旧图或改用外链', 'error');
            return;
          }
          uploadedFiles.forEach((file, i) => {
            if (images[i]) imageLibrary.unshift({ src: images[i], name: file.name, createdAt: nowText() });
          });
          saveLocalData();
          renderPanel('imageLibrary');
          showToast(`已上传 ${images.length} 张图片到图片库`, 'success');
        }, { maxSide: 1280 });
        return;
      }
      if (action === 'import-site-file') {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          document.getElementById('importSiteDataText').value = reader.result;
          markPanelDirty();
          showToast('备份文件已读取，点击导入备份生效', 'info');
        };
        reader.readAsText(file);
        return;
      }
      if (action === 'upload-template-image' && buildingTemplates[index]) {
        appendManagedImages('template', String(index), input.files, 10, '模板图片');
        return;
      }
      if (action === 'upload-play-image' && playItems[index]) {
        appendManagedImages('play', String(index), input.files, 10, '玩法图片');
        return;
      }
      if (action === 'upload-hero-image') {
        appendManagedImages('hero', '', input.files, 10, '首页轮播图');
        return;
      }
      if (action === 'upload-rules-image') {
        appendManagedImages('rules', '', input.files, 1, '服规小插图', 900);
        return;
      }
      if (action === 'upload-group-qr') {
        appendManagedImages('group', '', input.files, 1, '玩家群二维码', 900);
        return;
      }
    }

    function setupSectionDragSort() {
      const list = document.getElementById('sectionOrderList');
      if (!list) return;
      let dragged = null;
      list.querySelectorAll('[data-section-row]').forEach(row => {
        row.addEventListener('dragstart', () => {
          dragged = row;
          row.classList.add('dragging');
        });
        row.addEventListener('dragend', () => row.classList.remove('dragging'));
        row.addEventListener('dragover', event => {
          event.preventDefault();
          const target = event.currentTarget;
          if (!dragged || dragged === target) return;
          const box = target.getBoundingClientRect();
          const after = event.clientY > box.top + box.height / 2;
          list.insertBefore(dragged, after ? target.nextSibling : target);
          [...list.querySelectorAll('[data-section-row]')].forEach((item, index) => {
            const key = item.dataset.sectionRow;
            const orderInput = item.querySelector(`[data-section-order="${key}"]`);
            if (orderInput) orderInput.value = (index + 1) * 10;
          });
        });
      });
    }

    function openImageViewer(src, title = '', gallery = [src], index = 0) {
      if (!src) return;
      imageViewerGallery = gallery.filter(Boolean);
      imageViewerIndex = Math.max(0, Math.min(index, imageViewerGallery.length - 1));
      updateImageViewer(title);
      document.getElementById('imageViewer').classList.add('show');
    }

    function updateImageViewer(title = '') {
      const src = imageViewerGallery[imageViewerIndex] || '';
      document.getElementById('imageViewerImg').src = src;
      document.getElementById('imageViewerTitle').textContent = title;
      document.getElementById('imageViewerCount').textContent = imageViewerGallery.length > 1 ? `${imageViewerIndex + 1} / ${imageViewerGallery.length}` : '';
      document.getElementById('imageViewerPrev').disabled = imageViewerGallery.length <= 1;
      document.getElementById('imageViewerNext').disabled = imageViewerGallery.length <= 1;
    }

    function moveImageViewer(direction) {
      if (imageViewerGallery.length <= 1) return;
      imageViewerIndex = (imageViewerIndex + direction + imageViewerGallery.length) % imageViewerGallery.length;
      updateImageViewer(document.getElementById('imageViewerTitle').textContent);
    }

    function closeImageViewer() {
      document.getElementById('imageViewer').classList.remove('show');
      document.getElementById('imageViewerImg').removeAttribute('src');
      imageViewerGallery = [];
      imageViewerIndex = 0;
    }

    function showTemplateImage(index, direction) {
      const item = buildingTemplates[index];
      if (!item) return;
      const images = normalizeTemplateImages(item);
      if (!images.length) return;
      const card = document.querySelector(`[data-template-card="${index}"]`);
      if (!card) return;
      const current = Number(card.dataset.imageIndex || 0);
      const next = (current + direction + images.length) % images.length;
      card.dataset.imageIndex = next;
      const media = card.querySelector('.template-media');
      media.style.backgroundImage = `url('${images[next]}')`;
      media.dataset.openImage = images[next];
      media.dataset.imageIndex = String(next);
      const count = card.querySelector('.template-count');
      if (count) count.textContent = `${next + 1} / ${images.length}`;
    }

    function showPlayImage(index, direction) {
      const item = playItems[index];
      if (!item) return;
      const images = normalizePlayImages(item);
      if (!images.length) return;
      const card = document.querySelector(`[data-play-card="${index}"]`);
      if (!card) return;
      const current = Number(card.dataset.imageIndex || 0);
      const next = (current + direction + images.length) % images.length;
      card.dataset.imageIndex = next;
      const media = card.querySelector('.play-card-media');
      media.style.backgroundImage = `url('${images[next]}')`;
      media.dataset.openImage = images[next];
      media.dataset.imageIndex = String(next);
      const count = card.querySelector('.template-count');
      if (count) count.textContent = `${next + 1} / ${images.length}`;
    }

    function isAdminLoginPanel(name) {
      return name === 'adminLogin';
    }

    function canRenderAdminPanel(name) {
      return isAdminLoginPanel(name) || Boolean(adminToken);
    }

    function redirectToAdminLogin() {
      showToast('请先输入管理员密码', 'warning');
      renderPanel('adminLogin');
    }

    function renderPanel(name = 'overview') {
      if (!canRenderAdminPanel(name)) {
        name = 'adminLogin';
      }
      const lockedAdmin = name === 'adminLogin' && !adminToken;
      document.getElementById('panel')?.classList.toggle('admin-locked', lockedAdmin);
      document.querySelectorAll('[data-panel]').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === name));
      const panel = document.getElementById('panelMain');
      const view = panelViews[name] || panelViews.adminLogin;
      panel.innerHTML = typeof view === 'function' ? view() : view;
      applyIcons(panel);
      if (name === 'overview') {
        loadStats();
      }
      if (name === 'settings') {
        document.getElementById('saveServerInfo').addEventListener('click', saveServerSettings);
      }
      if (name === 'logs') {
        loadLogs(1);
        setTimeout(initLogEvents, 50);
      }
      if (name === 'visibilityManage') {
        document.getElementById('saveVisibility').addEventListener('click', saveVisibilitySettings);
        setupSectionDragSort();
      }
      if (name === 'homeManage') {
        document.getElementById('saveHomeHero').addEventListener('click', saveHomeHero);
        document.getElementById('saveHomeRules').addEventListener('click', saveHomeRules);
        document.getElementById('saveHomeFeatures').addEventListener('click', saveHomeFeatures);
        document.getElementById('saveHomeStats').addEventListener('click', saveHomeStats);
      }
      if (name === 'groupManage') {
        document.getElementById('saveGroupSettings').addEventListener('click', saveGroupSettings);
      }
      if (name === 'requestManage') {
        document.getElementById('adminRequestFilter')?.addEventListener('change', event => {
          adminRequestFilter = event.target.value;
          renderPanel('requestManage');
        });
        document.getElementById('saveRequestChanges')?.addEventListener('click', saveRequestChanges);
      }
      if (name === 'backupManage') {
        document.getElementById('exportSelected')?.addEventListener('click', exportSelectedModules);
        document.getElementById('importSelected')?.addEventListener('click', importSelectedModules);
        document.getElementById('resetSiteData')?.addEventListener('click', resetSiteData);
      }
      if (name === 'imageLibrary') {
        loadImageLibrary();
        initImageBatchSelection();
        document.getElementById('batchDeleteImages')?.addEventListener('click', handleBatchDeleteImages);
      }
      if (name !== 'adminLogin') {
        panel.oninput = markPanelDirty;
        panel.onchange = markPanelDirty;
      } else {
        panel.oninput = null;
        panel.onchange = null;
      }
      if (name === 'adminLogin') {
        document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
      }
      panel.onclick = async event => {
        const btn = event.target.closest('[data-action]');
        if (btn && panel.contains(btn)) await handlePanelAction(btn.dataset.action, Number(btn.dataset.index), event);
      };
      panel.querySelectorAll('input[type="file"][data-action]').forEach(input => {
        input.addEventListener('change', () => handlePanelFileAction(input));
      });
    }

    function registerPlayer(name) {
      activePlayerName = name.trim();
      localStorage.setItem('erp14-player-name', activePlayerName);
      const existing = playerSessions.find(player => player.name.toLowerCase() === activePlayerName.toLowerCase());
      if (existing) {
        existing.visits += 1;
        existing.lastSeen = nowText();
      } else {
        playerSessions.unshift({ name: activePlayerName, visits: 1, lastSeen: nowText() });
      }
      addLog('玩家进入网页', `${activePlayerName} 已登记并进入网页`, '登录', 'green');
      saveLocalData();
      document.getElementById('playerGate').classList.remove('show');
      document.getElementById('playerGate').setAttribute('hidden', '');
      renderAll();
      showToast(`欢迎，${activePlayerName}`, 'info');
    }

    function setupNoticeFloating() {
      const floating = document.getElementById('noticeFloating');
      const bubble = document.getElementById('noticeBubble');
      const closeBtn = document.getElementById('noticeClose');
      if (!floating || !bubble || !closeBtn) return;
      bubble.innerHTML = (icons.bell || '') + '<span class="notice-bubble-dot" aria-hidden="true"></span>';
      const NOTICE_COLLAPSED_KEY = 'erp14-notice-collapsed';
      if (localStorage.getItem(NOTICE_COLLAPSED_KEY) === '1') {
        floating.classList.add('collapsed');
      }
      closeBtn.addEventListener('click', () => {
        floating.classList.add('collapsed');
        localStorage.setItem(NOTICE_COLLAPSED_KEY, '1');
      });
      bubble.addEventListener('click', () => {
        floating.classList.remove('collapsed');
        localStorage.removeItem(NOTICE_COLLAPSED_KEY);
      });
    }

    function setupPlayerGate() {      const savedName = localStorage.getItem('erp14-player-name');
      const gate = document.getElementById('playerGate');
      if (savedName) {
        registerPlayer(savedName);
      } else {
        gate.classList.add('show');
        gate.removeAttribute('hidden');
      }
      document.getElementById('playerGateForm').addEventListener('submit', event => {
        event.preventDefault();
        const name = document.getElementById('playerGameName').value.trim();
        if (name.length < 2) {
          showToast('请输入至少 2 个字符的游戏名，或点击"先看看"跳过', 'warning');
          return;
        }
        registerPlayer(name);
      });
      document.getElementById('playerGateSkip').addEventListener('click', () => {
        gate.classList.remove('show');
        gate.setAttribute('hidden', '');
        showToast('已跳过登记，报名活动时需要填写游戏名称', 'info');
      });
    }

    document.getElementById('menuBtn').innerHTML = icons.menu;
    document.getElementById('menuBtn').addEventListener('click', () => document.getElementById('nav').classList.toggle('open'));
    document.getElementById('themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    document.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', event => {
        if (el.dataset.route) {
          event.preventDefault();
          switchRoute(el.dataset.route);
        }
      });
    });
    document.querySelectorAll('[data-toast]').forEach(el => el.addEventListener('click', () => showToast(el.dataset.toast)));
    document.getElementById('requestSearch').addEventListener('input', renderRequests);
    document.querySelectorAll('#requestTabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#requestTabs button').forEach(item => item.classList.remove('active'));
        btn.classList.add('active');
        renderRequests();
      });
    });
    document.querySelectorAll('#requestCategoryFilters button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#requestCategoryFilters button').forEach(item => item.classList.remove('active'));
        btn.classList.add('active');
        renderRequests();
      });
    });
    document.getElementById('openRequest').addEventListener('click', openRequestModal);
    document.getElementById('cancelRequest').addEventListener('click', closeRequestModal);
    document.getElementById('closeRequest').addEventListener('click', closeRequestModal);
    document.getElementById('requestImages').addEventListener('change', event => handleRequestImageFiles(event.target.files));
    document.getElementById('requestForm').addEventListener('submit', submitRequest);
    document.getElementById('eventSignupForm').addEventListener('submit', submitEventSignup);
    document.getElementById('cancelEventSignup').addEventListener('click', closeEventSignup);
    document.getElementById('closeEventSignup').addEventListener('click', closeEventSignup);
    document.getElementById('closeImageViewer').addEventListener('click', closeImageViewer);
    document.getElementById('imageViewerPrev').addEventListener('click', () => moveImageViewer(-1));
    document.getElementById('imageViewerNext').addEventListener('click', () => moveImageViewer(1));
    document.getElementById('imageViewer').addEventListener('click', event => {
      if (event.target.id === 'imageViewer') closeImageViewer();
    });
    document.querySelectorAll('[data-panel]').forEach(btn => btn.addEventListener('click', () => {
      if (!canRenderAdminPanel(btn.dataset.panel)) {
        redirectToAdminLogin();
        return;
      }
      renderPanel(btn.dataset.panel);
    }));
    document.addEventListener('change', event => {
      const select = event.target.closest('[data-update-field="activityType-select"]');
      if (select) {
        const index = select.dataset.index;
        const hidden = document.querySelector(`[data-update-field="activityType"][data-index="${index}"]`);
        if (hidden) hidden.value = select.value;
        if (updates[index]) {
          updates[index].activityType = select.value;
          renderPanel('updateManage');
        }
      }
    });

    document.addEventListener('click', event => {
      const statusBtn = event.target.closest('[data-status-select]');
      if (statusBtn) {
        const index = statusBtn.dataset.index;
        const value = statusBtn.dataset.statusSelect;
        const hidden = document.querySelector(`[data-update-field="status"][data-index="${index}"]`);
        if (hidden) hidden.value = value;
        document.querySelectorAll(`[data-status-select][data-index="${index}"]`).forEach(btn => btn.classList.toggle('active', btn === statusBtn));
        return;
      }
      const frontVote = event.target.closest('[data-action="vote-request"]');
      if (frontVote && !frontVote.closest('#panelMain')) {
        voteRequest(Number(frontVote.dataset.index), frontVote.dataset.vote || 'agree');
        return;
      }
      const signupTrigger = event.target.closest('[data-open-signup]');
      if (signupTrigger) {
        openEventSignup(Number(signupTrigger.dataset.openSignup));
        return;
      }
      const trigger = event.target.closest('[data-toast]');
      if (trigger) showToast(trigger.dataset.toast);
      const removeRequestImage = event.target.closest('[data-request-image-remove]');
      if (removeRequestImage) {
        pendingRequestImages.splice(Number(removeRequestImage.dataset.requestImageRemove), 1);
        updateRequestImagePreview();
        return;
      }
      const imageTrigger = event.target.closest('[data-open-image]');
      if (imageTrigger) {
        const galleryName = imageTrigger.dataset.gallery;
        let gallery = [imageTrigger.dataset.openImage];
        if (galleryName?.startsWith('template-')) {
          const templateIndex = Number(galleryName.replace('template-', ''));
          gallery = normalizeTemplateImages(buildingTemplates[templateIndex] || {});
        } else if (galleryName?.startsWith('play-')) {
          const playIndex = Number(galleryName.replace('play-', ''));
          gallery = normalizePlayImages(playItems[playIndex] || {});
        } else if (galleryName) {
          gallery = [...document.querySelectorAll(`[data-open-image][data-gallery="${galleryName}"]`)].map(item => item.dataset.openImage);
        }
        const index = Math.max(0, gallery.indexOf(imageTrigger.dataset.openImage));
        openImageViewer(imageTrigger.dataset.openImage, imageTrigger.dataset.imageTitle || '', gallery, index);
      }
      const templateControl = event.target.closest('[data-template-control]');
      if (templateControl) showTemplateImage(Number(templateControl.dataset.index), templateControl.dataset.templateControl === 'next' ? 1 : -1);
      const playControl = event.target.closest('[data-play-control]');
      if (playControl) showPlayImage(Number(playControl.dataset.index), playControl.dataset.playControl === 'next' ? 1 : -1);
    });

    function renderAll() {
      renderHero();
      renderNewPlayerGuide();
      renderHeroCarousel();
      renderHomeStats();
      renderHomeFeatures();
      renderHomeSuggestions();
      renderBuildingTemplates();
      renderServerRules();
      applySectionControls();
      renderPlay();
      renderRequests();
      renderUpdates();
      renderActivitySignups();
      const activePanel = document.querySelector('[data-panel].active')?.dataset.panel || 'overview';
      renderPanel(activePanel);
      applyContentOverrides();
    }

    document.getElementById('newPlayerGuideSection')?.addEventListener('click', event => {
      const button = event.target.closest('[data-guide-action]');

      if (!button) {
        return;
      }

      const action = button.dataset.guideAction;

      if (action === 'copy-ip') {
        copyGuideText(
          serverInfo.ip,
          '服务器 IP 已复制',
          '复制失败，请手动复制页面上的服务器 IP'
        );
      }

      if (action === 'copy-group') {
        copyGuideText(
          serverInfo.group,
          '群号已复制，请打开 QQ 搜索并申请加入',
          '复制失败，请手动复制页面上的 QQ 群号'
        );
      }

      if (action === 'read-rules') {
        document.getElementById('homeRulesSection')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }

      if (action === 'enter-server') {
        showToast(
          '请打开 SCUM，使用已复制的服务器 IP 搜索或直连',
          'info'
        );
      }

      if (action === 'contact-admin') {
        showToast(
          '请复制 QQ 群号，进群后联系管理员',
          'info'
        );
      }
    });

    setTheme(localStorage.getItem('erp14-theme') || 'light');
    loadLocalData();
    applyIcons();
    normalizeUpdates();
    renderAll();
    setupPlayerGate();
    setupNoticeFloating();
    setupActivityRailScroll();
    setupActivityAutoScroll();
    // 未登录访客：只拉取公开配置，敏感字段不进入前端内存。
    loadPublicBackendConfig();
    // 若 localStorage 里已有 token（本次会话之前登录过），尝试拉取完整配置。
    if (adminToken) {
      loadFullBackendConfig();
    }
    loadEventSignupCounts();

    // 统计数据定时刷新
    setInterval(loadStats, 60000);

    // 轮播自动播放 + 进度条 + 悬停暂停
    if (heroImages.length > 1) {
      const heroEl = document.querySelector('.hero');
      if (heroEl) {
        heroEl.addEventListener('mouseenter', stopHeroAutoPlay);
        heroEl.addEventListener('mouseleave', startHeroAutoPlay);
      }
      startHeroAutoPlay();
    }
    const initial = location.hash.replace('#', '');
    if (initial && document.getElementById(initial)) switchRoute(initial);