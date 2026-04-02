export type Language = 'en' | 'zh';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'header.skills': 'Skills',
    'header.search': 'Search',
    'header.signin': 'Sign in',
    'header.signout': 'Sign out',

    // Hero
    'hero.badge': 'Learning-light. Agent-right.',
    'hero.title': 'LearningHub, the skill dock for sharp agents.',
    'hero.subtitle': 'Upload AgentSkills bundles, version them like npm, and make them searchable with vectors. No gatekeeping, just signal.',
    'hero.publishSkill': 'Publish Skill',
    'hero.browseSkills': 'Browse skills',
    'hero.install': 'Install any skill folder in one shot:',

    // Sections
    'section.highlighted': 'Highlighted skills',
    'section.highlightedDesc': 'Curated signal — highlighted for quick trust.',
    'section.popular': 'Popular skills',
    'section.popularDesc': 'Most-downloaded, non-suspicious picks.',
    'section.noSkillsYet': 'No skills yet. Be the first.',
    'section.seeAll': 'See all skills',

    // Login Dialog
    'login.signIn': 'Sign In',
    'login.createAccount': 'Create Account',
    'login.email': 'Email',
    'login.emailPlaceholder': 'you@example.com',
    'login.password': 'Password',
    'login.passwordPlaceholder': 'Your password',
    'login.displayName': 'Display Name',
    'login.displayNamePlaceholder': 'Your name (optional)',
    'login.signInBtn': 'Sign In',
    'login.signUpBtn': 'Sign Up',
    'login.dontHaveAccount': "Don't have an account?",
    'login.signUpLink': 'Sign up',
    'login.haveAccount': 'Already have an account?',
    'login.signInLink': 'Sign in',

    // Publish Skill
    'publish.title': 'Publish Skill',
    'publish.slug': 'Slug',
    'publish.displayName': 'Display Name',
    'publish.version': 'Version',
    'publish.tags': 'Tags',
    'publish.changelog': 'Changelog',
    'publish.files': 'Files',
    'publish.upload': 'Upload Files',
    'publish.publish': 'Publish',
    'publish.cancel': 'Cancel',
    'publish.mustSignIn': 'Sign in to publish a skill.',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
  },
  zh: {
    // 页头
    'header.skills': '技能',
    'header.search': '搜索',
    'header.signin': '登录',
    'header.signout': '退出',

    // 英雄区
    'hero.badge': '学习轻灵，代理强势。',
    'hero.title': 'LearningHub，智能代理的技能库。',
    'hero.subtitle': '上传 AgentSkills 包，像 npm 一样进行版本管理，并通过向量搜索使其可搜索。无审查，只有信号。',
    'hero.publishSkill': '发布技能',
    'hero.browseSkills': '浏览技能',
    'hero.install': '一次性安装任何技能文件夹：',

    // 分栏
    'section.highlighted': '精选技能',
    'section.highlightedDesc': '精选信号 — 精选以获得快速信任。',
    'section.popular': '热门技能',
    'section.popularDesc': '最常下载的、非恶意的选择。',
    'section.noSkillsYet': '暂无技能。成为第一个。',
    'section.seeAll': '查看全部',

    // 登录对话框
    'login.signIn': '登录',
    'login.createAccount': '创建账户',
    'login.email': '邮箱',
    'login.emailPlaceholder': 'you@example.com',
    'login.password': '密码',
    'login.passwordPlaceholder': '您的密码',
    'login.displayName': '显示名称',
    'login.displayNamePlaceholder': '您的名字（可选）',
    'login.signInBtn': '登录',
    'login.signUpBtn': '注册',
    'login.dontHaveAccount': '还没有账户？',
    'login.signUpLink': '注册',
    'login.haveAccount': '已有账户？',
    'login.signInLink': '登录',

    // 发布技能
    'publish.title': '发布技能',
    'publish.slug': '标识符',
    'publish.displayName': '显示名称',
    'publish.version': '版本',
    'publish.tags': '标签',
    'publish.changelog': '更改日志',
    'publish.files': '文件',
    'publish.upload': '上传文件',
    'publish.publish': '发布',
    'publish.cancel': '取消',
    'publish.mustSignIn': '登录后才能发布技能。',

    // 通用
    'common.loading': '加载中...',
    'common.error': '出错了',
    'common.success': '成功',
  },
};

export function getTranslation(language: Language, key: string): string {
  return translations[language][key] || key;
}
