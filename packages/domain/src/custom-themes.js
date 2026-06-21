/**
 * Custom Themes - User-created theme presets
 * 
 * Apple philosophy: personalization enhances the experience.
 * Users can create and save their own color schemes.
 */

const STORAGE_KEY = 'typing-raid-custom-themes';

export const THEME_PRESETS = {
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    nameZh: '日落',
    desc: 'Warm orange and pink tones',
    descZh: '温暖的橙粉色调',
    colors: {
      bg: '#1a0a00',
      bgGradientStart: '#2e1500',
      bgGradientEnd: '#1a0a00',
      normal: '#ff7043',
      fast: '#ffab40',
      tank: '#ff5722',
      boss: '#ff1744',
      success: '#69f0ae',
      error: '#ff5252',
      text: '#fff3e0',
    },
    particleStyle: 'ember',
  },
  
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    nameZh: '海洋',
    desc: 'Deep blue and teal tones',
    descZh: '深蓝青色调',
    colors: {
      bg: '#001a1a',
      bgGradientStart: '#002e2e',
      bgGradientEnd: '#001a1a',
      normal: '#00bcd4',
      fast: '#26c6da',
      tank: '#0097a7',
      boss: '#ff4081',
      success: '#69f0ae',
      error: '#ff5252',
      text: '#e0f7fa',
    },
    particleStyle: 'aurora',
  },
  
  forest: {
    id: 'forest',
    name: 'Forest',
    nameZh: '森林',
    desc: 'Natural green tones',
    descZh: '自然绿色调',
    colors: {
      bg: '#0a1a0a',
      bgGradientStart: '#152e15',
      bgGradientEnd: '#0a1a0a',
      normal: '#66bb6a',
      fast: '#81c784',
      tank: '#43a047',
      boss: '#ff7043',
      success: '#aed581',
      error: '#ef5350',
      text: '#e8f5e9',
    },
    particleStyle: 'sparkle',
  },
  
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    nameZh: '樱花',
    desc: 'Soft pink and white tones',
    descZh: '柔和粉白色调',
    colors: {
      bg: '#1a0a14',
      bgGradientStart: '#2e1520',
      bgGradientEnd: '#1a0a14',
      normal: '#f48fb1',
      fast: '#f8bbd0',
      tank: '#ec407a',
      boss: '#ff4081',
      success: '#aed581',
      error: '#ef5350',
      text: '#fce4ec',
    },
    particleStyle: 'sparkle',
  },
  
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    nameZh: '赛博朋克',
    desc: 'Neon colors on dark background',
    descZh: '暗背景上的霓虹色',
    colors: {
      bg: '#0a0014',
      bgGradientStart: '#1a002e',
      bgGradientEnd: '#0a0014',
      normal: '#00e5ff',
      fast: '#76ff03',
      tank: '#ffea00',
      boss: '#ff1744',
      success: '#00e676',
      error: '#ff1744',
      text: '#e0e0e0',
    },
    particleStyle: 'neon',
  },
};

export function getAllPresets() {
  return Object.values(THEME_PRESETS);
}

export function getPreset(presetId) {
  return THEME_PRESETS[presetId] || null;
}

// ---------------------------------------------------------------------------
// Custom Theme Management
// ---------------------------------------------------------------------------

export function loadCustomThemes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveCustomTheme(theme) {
  const themes = loadCustomThemes();
  const existing = themes.findIndex(t => t.id === theme.id);
  
  if (existing >= 0) {
    themes[existing] = theme;
  } else {
    themes.push(theme);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  } catch {}
  
  return themes;
}

export function deleteCustomTheme(themeId) {
  const themes = loadCustomThemes();
  const filtered = themes.filter(t => t.id !== themeId);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
  
  return filtered;
}

export function createCustomTheme(basePresetId, customizations) {
  const base = getPreset(basePresetId);
  if (!base) return null;
  
  return {
    ...base,
    id: 'custom-' + Date.now(),
    name: customizations.name || base.name,
    nameZh: customizations.nameZh || base.nameZh,
    desc: customizations.desc || base.desc,
    descZh: customizations.descZh || base.descZh,
    colors: { ...base.colors, ...customizations.colors },
    isCustom: true,
  };
}

export function getAllAvailableThemes() {
  const presets = getAllPresets();
  const customs = loadCustomThemes();
  return [...presets, ...customs];
}
