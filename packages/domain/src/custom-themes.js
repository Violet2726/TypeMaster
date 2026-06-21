/**
 * Custom Themes - User-created theme presets
 * 
 * Apple philosophy: personalization enhances connection.
 */

export const CUSTOM_THEME_PRESETS = {
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    nameZh: '日落',
    colors: {
      primary: '#ff6b6b',
      secondary: '#ffa502',
      accent: '#ff4757',
      bg: '#1a0a0a',
      text: '#ffffff',
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    nameZh: '海洋',
    colors: {
      primary: '#0984e3',
      secondary: '#74b9ff',
      accent: '#00cec9',
      bg: '#0a1628',
      text: '#ffffff',
    }
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    nameZh: '森林',
    colors: {
      primary: '#00b894',
      secondary: '#55efc4',
      accent: '#00cec9',
      bg: '#0a1a0a',
      text: '#ffffff',
    }
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    nameZh: '樱花',
    colors: {
      primary: '#fd79a8',
      secondary: '#fab1a0',
      accent: '#e17055',
      bg: '#1a0a14',
      text: '#ffffff',
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    nameZh: '赛博朋克',
    colors: {
      primary: '#00ff9f',
      secondary: '#00b894',
      accent: '#fd79a8',
      bg: '#0a0a1a',
      text: '#00ff9f',
    }
  },
};

export function getCustomTheme(themeId) {
  return CUSTOM_THEME_PRESETS[themeId] || null;
}

export function getAllCustomThemes() {
  return Object.values(CUSTOM_THEME_PRESETS);
}

export function createCustomTheme(name, nameZh, colors) {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    name,
    nameZh,
    colors,
    isCustom: true,
  };
}
