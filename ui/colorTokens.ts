import { PaletteMode } from '@mui/material'

export const tokens = (mode: PaletteMode) => ({
  ...(mode === 'dark'
    ? {
        // Dark mode
        // Primary color
        primary: {
          100: '#e3e6e8', // Light Gray
          200: '#c7cdd1', // Gray
          300: '#abb4ba', // Medium Gray
          400: '#8f9ba3', // Dark Gray
          500: '#73828c', // Grayish Blue
          600: '#5c6870', // Dark Grayish Blue
          700: '#454e54', // Darker Grayish Blue
          800: '#2e3438', // Darker Gray
          900: '#171a1c', // Black
        },
        // Secondary color
        secondary: {
          100: '#e4e3e8', // Light Gray
          200: '#c9c7d1', // Gray
          300: '#afabba', // Medium Gray
          400: '#948fa3', // Dark Gray
          500: '#79738c', // Grayish Blue
          600: '#615c70', // Dark Grayish Blue
          700: '#494554', // Darker Grayish Blue
          800: '#302e38', // Darker Gray
          900: '#18171c', // Black
        },
        // Accent orange
        accent: {
          ...commonColors.accent,
        },
        // Common grey
        grey: {
          ...commonColors.grey,
        },
      }
    : {
        // Light mode
        // Primary color
        primary: {
          100: '#cfe9fc', // Light Blue
          200: '#9ed4fa', // Blue
          300: '#6ebef7', // Medium Blue
          400: '#3da9f5', // Dark Blue
          500: '#0d93f2', // Deep Blue
          600: '#0a76c2', // Dark Deep Blue
          700: '#085891', // Darker Deep Blue
          800: '#053b61', // Darker Blue
          900: '#031d30', // Black
        },
        // Secondary color
        secondary: {
          100: '#dacffc', // Light Blue
          200: '#b59efa', // Blue
          300: '#906ef7', // Medium Blue
          400: '#6b3df5', // Dark Blue
          500: '#460df2', // Deep Blue
          600: '#380ac2', // Dark Deep Blue
          700: '#2a0891', // Darker Deep Blue
          800: '#1c0561', // Darker Blue
          900: '#0e0330', // Black
        },
        // Accent orange
        accent: {
          ...commonColors.accent,
        },
        // Common grey
        grey: {
          ...commonColors.grey,
        },
      }),
})

// Common accent and grey colors for both light and dark modes
const commonColors = {
  accent: {
    100: '#fce6cf', // Light Orange
    200: '#facc9e', // Orange
    300: '#f7b36e', // Medium Orange
    400: '#f5993d', // Dark Orange
    500: '#f2800d', // Deep Orange
    600: '#c2660a', // Dark Deep Orange
    700: '#914d08', // Darker Deep Orange
    800: '#613305', // Darker Orange
    900: '#301a03', // Black
  },
  grey: {
    100: '#e6e6e6',
    200: '#cccccc',
    300: '#b3b3b3',
    400: '#999999',
    500: '#808080',
    600: '#666666',
    700: '#4d4d4d',
    800: '#333333',
    900: '#1a1a1a',
  },
}
