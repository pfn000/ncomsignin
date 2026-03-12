import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const appTheme = (darkMode: boolean): MD3Theme => {
  const base = darkMode ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: 8,
    colors: {
      ...base.colors,
      primary: '#38bdf8'
    }
  };
};
