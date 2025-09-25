export interface ThemeSettings {
  themeMode: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  borderRadius: string
  fontFamily: string
  logoUrl?: string
  faviconUrl?: string
  customCss?: string
}

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  ring: string
}

export class ThemeUtils {
  /**
   * Generate CSS custom properties from theme settings
   */
  static generateThemeCSS(settings: ThemeSettings): string {
    const css = `
      :root {
        --theme-mode: ${settings.themeMode};
        --border-radius: ${settings.borderRadius};
        --font-family: ${settings.fontFamily};
        ${settings.primaryColor ? `--primary: ${settings.primaryColor};` : ''}
        ${settings.secondaryColor ? `--secondary: ${settings.secondaryColor};` : ''}
        ${settings.accentColor ? `--accent: ${settings.accentColor};` : ''}
      }
      
      ${settings.customCss || ''}
    `
    
    return css.trim()
  }

  /**
   * Convert hex color to OKLCH format
   */
  static hexToOklch(hex: string): string {
    // Simple hex to OKLCH conversion (simplified)
    // In a real implementation, you'd use a proper color conversion library
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    
    // Convert to OKLCH (simplified approximation)
    const l = (r + g + b) / 3
    const c = Math.sqrt((r - l) ** 2 + (g - l) ** 2 + (b - l) ** 2)
    const h = Math.atan2(b - g, r - l) * 180 / Math.PI
    
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
  }

  /**
   * Generate theme colors based on primary color
   */
  static generateThemeColors(primaryColor?: string): ThemeColors {
    if (!primaryColor) {
      return {
        primary: 'oklch(0.205 0 0)',
        secondary: 'oklch(0.97 0 0)',
        accent: 'oklch(0.97 0 0)',
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.145 0 0)',
        card: 'oklch(1 0 0)',
        cardForeground: 'oklch(0.145 0 0)',
        popover: 'oklch(1 0 0)',
        popoverForeground: 'oklch(0.145 0 0)',
        muted: 'oklch(0.97 0 0)',
        mutedForeground: 'oklch(0.556 0 0)',
        border: 'oklch(0.922 0 0)',
        input: 'oklch(0.922 0 0)',
        ring: 'oklch(0.708 0 0)'
      }
    }

    const primaryOklch = this.hexToOklch(primaryColor)
    
    return {
      primary: primaryOklch,
      secondary: 'oklch(0.97 0 0)',
      accent: 'oklch(0.97 0 0)',
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.145 0 0)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.145 0 0)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.145 0 0)',
      muted: 'oklch(0.97 0 0)',
      mutedForeground: 'oklch(0.556 0 0)',
      border: 'oklch(0.922 0 0)',
      input: 'oklch(0.922 0 0)',
      ring: primaryOklch
    }
  }

  /**
   * Validate theme settings
   */
  static validateThemeSettings(settings: Partial<ThemeSettings>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (settings.themeMode && !['light', 'dark', 'system'].includes(settings.themeMode)) {
      errors.push('Theme mode must be light, dark, or system')
    }

    if (settings.primaryColor && !this.isValidHexColor(settings.primaryColor)) {
      errors.push('Primary color must be a valid hex color')
    }

    if (settings.secondaryColor && !this.isValidHexColor(settings.secondaryColor)) {
      errors.push('Secondary color must be a valid hex color')
    }

    if (settings.accentColor && !this.isValidHexColor(settings.accentColor)) {
      errors.push('Accent color must be a valid hex color')
    }

    if (settings.borderRadius && !this.isValidBorderRadius(settings.borderRadius)) {
      errors.push('Border radius must be a valid CSS value')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if hex color is valid
   */
  private static isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }

  /**
   * Check if border radius is valid
   */
  private static isValidBorderRadius(radius: string): boolean {
    // Basic validation for CSS border-radius values
    return /^(\d+(\.\d+)?(rem|px|em|%)|\d+(\.\d+)?)$/.test(radius)
  }
}
