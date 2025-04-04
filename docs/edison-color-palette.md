# Edison Color Palette Guide

## Primary Colors

### Edison Blue
- **HEX**: #0A4B94
- **RGB**: 10, 75, 148
- **CMYK**: 93, 49, 0, 42
- **Pantone**: 301 C

#### Usage
Edison Blue represents trust, reliability, and professionalism. It serves as the primary brand color and should be used for:
- Primary logo color
- Main navigation elements
- Primary buttons and interactive elements
- Section headings
- Data visualization primary color

#### Accessibility
Edison Blue meets WCAG 2.1 AA standards for contrast when used with white text at 16px or larger.

### Illumination Yellow
- **HEX**: #FFD166
- **RGB**: 255, 209, 102
- **CMYK**: 0, 18, 60, 0
- **Pantone**: 1215 C

#### Usage
Illumination Yellow represents ideas, innovation, and energy. It should be used for:
- Accent elements
- Highlighting important information
- The filament in the light bulb logo
- Call-to-action elements that need to stand out
- Eddie the mascot's primary color

#### Accessibility
When using Illumination Yellow with text, ensure the text is dark (preferably Edison Blue or Patent Black) to maintain readability.

### Patent Paper
- **HEX**: #F9F7F1
- **RGB**: 249, 247, 241
- **CMYK**: 1, 1, 4, 2
- **Pantone**: 7499 C

#### Usage
Patent Paper is a warm off-white that references traditional patent documents. It should be used for:
- Page backgrounds
- Card backgrounds
- Document viewers
- Form backgrounds
- Subtle dividers and separators

#### Accessibility
Patent Paper provides a softer alternative to pure white, reducing eye strain while maintaining a clean, professional appearance.

## Secondary Colors

### Insight Green
- **HEX**: #3CBBB1
- **RGB**: 60, 187, 177
- **CMYK**: 68, 0, 5, 27
- **Pantone**: 326 C

#### Usage
Insight Green represents clarity, growth, and success. It should be used for:
- Success states and confirmations
- Progress indicators
- "Validated" or "Approved" status indicators
- Secondary buttons and interactive elements
- Data visualization for positive trends

#### Accessibility
Ensure adequate contrast when using Insight Green with text by using darker text colors.

### Invention Purple
- **HEX**: #9656A1
- **RGB**: 150, 86, 161
- **CMYK**: 7, 47, 0, 37
- **Pantone**: 2583 C

#### Usage
Invention Purple represents creativity, imagination, and innovation. It should be used for:
- Creative features and tools
- Premium or advanced features
- Secondary accents
- Data visualization for innovation metrics
- Background elements in creative sections

#### Accessibility
Use white or very light text when placing text on Invention Purple backgrounds.

### Warning Orange
- **HEX**: #FF7F51
- **RGB**: 255, 127, 81
- **CMYK**: 0, 50, 68, 0
- **Pantone**: 1645 C

#### Usage
Warning Orange represents caution, attention, and energy. It should be used for:
- Warning messages
- Notification badges
- Highlighting potential conflicts or issues
- Time-sensitive information
- Important alerts that aren't critical errors

#### Accessibility
Ensure adequate contrast when using Warning Orange with text by using dark text colors.

## Neutral Colors

### Patent Black
- **HEX**: #2D2E36
- **RGB**: 45, 46, 54
- **CMYK**: 17, 15, 0, 79
- **Pantone**: Black 7 C

#### Usage
Patent Black is a soft black that's less harsh than pure black. It should be used for:
- Primary text
- Icons
- Borders when needed
- Footer backgrounds
- High-contrast UI elements

#### Accessibility
Patent Black provides excellent contrast with light backgrounds while being slightly softer than pure black.

### Graphite Gray
- **HEX**: #5E6277
- **RGB**: 94, 98, 119
- **CMYK**: 21, 18, 0, 53
- **Pantone**: Cool Gray 11 C

#### Usage
Graphite Gray is used for secondary text and UI elements. It should be used for:
- Secondary text
- Inactive states
- Subtle UI elements
- Form field borders
- Dividers and separators

#### Accessibility
Graphite Gray should be used carefully with colored backgrounds to ensure adequate contrast.

### Light Gray
- **HEX**: #D8D9E0
- **RGB**: 216, 217, 224
- **CMYK**: 4, 3, 0, 12
- **Pantone**: Cool Gray 2 C

#### Usage
Light Gray is used for subtle backgrounds and dividers. It should be used for:
- Table alternating rows
- Disabled states
- Subtle backgrounds
- Horizontal rules and dividers
- Secondary borders

#### Accessibility
Avoid using Light Gray for text as it may not provide sufficient contrast with backgrounds.

## Color Combinations

### Primary UI Combination
- Background: Patent Paper (#F9F7F1)
- Primary Elements: Edison Blue (#0A4B94)
- Accents: Illumination Yellow (#FFD166)
- Text: Patent Black (#2D2E36)

### Call-to-Action Combination
- Button Background: Edison Blue (#0A4B94)
- Button Text: White (#FFFFFF)
- Hover State: Darker blue (#083C78)
- Secondary Button: Outlined with Edison Blue, transparent background

### Alert Combinations
- Success: Insight Green (#3CBBB1) with dark text
- Warning: Warning Orange (#FF7F51) with dark text
- Error: #E63946 (not in primary palette) with white text
- Information: Edison Blue (#0A4B94) with white text

### Data Visualization Palette
1. Primary: Edison Blue (#0A4B94)
2. Secondary: Illumination Yellow (#FFD166)
3. Tertiary: Insight Green (#3CBBB1)
4. Quaternary: Invention Purple (#9656A1)
5. Quinary: Warning Orange (#FF7F51)

## Gradient Usage

### Innovation Gradient
A gradient from Edison Blue to Invention Purple can be used for:
- Feature section backgrounds
- Marketing materials
- Special announcements
- Premium feature indicators

### Specification
- Start: Edison Blue (#0A4B94) at 0%
- End: Invention Purple (#9656A1) at 100%
- Direction: 135 degrees (bottom-left to top-right)

### Illumination Gradient
A gradient from Illumination Yellow to Warning Orange can be used for:
- Eddie the mascot's glow effect
- Energy indicators
- Special promotions
- Creative tool backgrounds

### Specification
- Start: Illumination Yellow (#FFD166) at 0%
- End: Warning Orange (#FF7F51) at 100%
- Direction: 90 degrees (left to right)

## Color Accessibility Guidelines

1. **Text Legibility**: Maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (18pt or 14pt bold).

2. **Interactive Elements**: Ensure all interactive elements have a minimum contrast ratio of 3:1 against adjacent colors.

3. **Color Blindness Considerations**: Do not rely solely on color to convey information. Always use additional indicators (icons, patterns, labels) alongside color.

4. **Dark Mode Adaptations**: When implementing dark mode, adjust the color palette as follows:
   - Background: Dark navy (#121A29) instead of Patent Paper
   - Text: Light gray (#E8E9F0) instead of Patent Black
   - Accent colors: Slightly brightened versions of the standard palette

## Implementation Examples

### Website Header
- Background: Edison Blue (#0A4B94)
- Logo: White version
- Navigation Text: White (#FFFFFF)
- Active Navigation Item: Underlined with Illumination Yellow (#FFD166)

### Search Interface
- Background: Patent Paper (#F9F7F1)
- Search Bar: White (#FFFFFF) with Edison Blue border
- Search Button: Edison Blue (#0A4B94) with white text
- Filter Chips: Light Gray (#D8D9E0) with Patent Black text
- Selected Filters: Illumination Yellow (#FFD166) with Patent Black text

### Patent Detail Card
- Card Background: White (#FFFFFF)
- Card Border: Light Gray (#D8D9E0)
- Title: Edison Blue (#0A4B94)
- Metadata: Graphite Gray (#5E6277)
- Status Indicator: Color-coded based on status (Insight Green for active, Warning Orange for pending)

### Eddie Mascot Implementation
- Body: Illumination Yellow (#FFD166)
- Glasses and Details: Edison Blue (#0A4B94)
- Glow Effect: Illumination Gradient
- Speech Bubbles: White (#FFFFFF) with Patent Black text
