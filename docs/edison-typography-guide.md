# Edison Typography Guide

## Primary Font: Montserrat

Montserrat is our primary typeface, chosen for its clean, modern appearance and excellent readability across digital platforms. It combines geometric precision with a warm, approachable character that aligns perfectly with the Edison brand personality.

### Font Acquisition

- **Web Use**: Available via Google Fonts
- **Desktop Use**: Available for download via Google Fonts
- **License**: Open Font License (OFL)

### Primary Font Weights

| Weight | Usage |
|--------|-------|
| Montserrat Bold (700) | Headings, buttons, emphasis |
| Montserrat SemiBold (600) | Subheadings, important UI elements |
| Montserrat Medium (500) | Navigation, UI elements, emphasis in body text |
| Montserrat Regular (400) | Body text, general UI text |
| Montserrat Light (300) | Large text blocks, captions, secondary information |

### Font Sizes - Web/Desktop

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|---------------|
| H1 | 32px/2rem | Bold | 40px/2.5rem | -0.5px |
| H2 | 24px/1.5rem | Bold | 32px/2rem | -0.3px |
| H3 | 20px/1.25rem | SemiBold | 28px/1.75rem | -0.2px |
| H4 | 18px/1.125rem | SemiBold | 24px/1.5rem | -0.1px |
| H5 | 16px/1rem | SemiBold | 22px/1.375rem | 0 |
| H6 | 14px/0.875rem | SemiBold | 20px/1.25rem | 0 |
| Body | 16px/1rem | Regular | 24px/1.5rem | 0 |
| Small/Caption | 14px/0.875rem | Regular | 20px/1.25rem | 0.1px |
| Button | 16px/1rem | Medium | 24px/1.5rem | 0.2px |
| Navigation | 16px/1rem | Medium | 24px/1.5rem | 0.1px |
| Footer | 14px/0.875rem | Regular | 20px/1.25rem | 0 |

### Font Sizes - Mobile

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|---------------|
| H1 | 28px/1.75rem | Bold | 36px/2.25rem | -0.5px |
| H2 | 22px/1.375rem | Bold | 30px/1.875rem | -0.3px |
| H3 | 18px/1.125rem | SemiBold | 26px/1.625rem | -0.2px |
| H4 | 16px/1rem | SemiBold | 22px/1.375rem | -0.1px |
| H5 | 15px/0.9375rem | SemiBold | 21px/1.3125rem | 0 |
| H6 | 14px/0.875rem | SemiBold | 20px/1.25rem | 0 |
| Body | 16px/1rem | Regular | 24px/1.5rem | 0 |
| Small/Caption | 13px/0.8125rem | Regular | 18px/1.125rem | 0.1px |
| Button | 16px/1rem | Medium | 24px/1.5rem | 0.2px |
| Navigation | 15px/0.9375rem | Medium | 22px/1.375rem | 0.1px |
| Footer | 13px/0.8125rem | Regular | 18px/1.125rem | 0 |

## Secondary Font: Merriweather

Merriweather is our secondary typeface, used primarily for longer-form content and patent document displays. Its serif design provides excellent readability for detailed information and creates a nice contrast with Montserrat.

### Font Acquisition

- **Web Use**: Available via Google Fonts
- **Desktop Use**: Available for download via Google Fonts
- **License**: Open Font License (OFL)

### Secondary Font Weights

| Weight | Usage |
|--------|-------|
| Merriweather Bold (700) | Document headings, important citations |
| Merriweather Regular (400) | Document body text, patent claims |
| Merriweather Light (300) | Extended document text, footnotes |

### Usage Guidelines

Merriweather should be used for:
- Patent document display
- Legal information
- Terms of service
- Privacy policy
- Detailed technical documentation
- Blog posts and articles
- Case studies

## Typographic Hierarchy

### Website Example

```
MONTSERRAT BOLD 32PX
Main Heading (H1)

MONTSERRAT SEMIBOLD 24PX
Section Heading (H2)

MONTSERRAT SEMIBOLD 20PX
Subsection Heading (H3)

MONTSERRAT REGULAR 16PX
Body text goes here. Edison makes patent information accessible and understandable for inventors and businesses of all sizes. Our platform combines powerful search capabilities with intuitive visualization tools.

MONTSERRAT MEDIUM 16PX
Interactive elements and emphasis within body text.

MONTSERRAT REGULAR 14PX
Captions, metadata, and secondary information appear in smaller text.
```

### Patent Document Example

```
MONTSERRAT BOLD 24PX
Patent Title (H2)

MERRIWEATHER REGULAR 16PX
Abstract and detailed patent information is displayed in Merriweather for optimal readability of dense technical content.

MONTSERRAT SEMIBOLD 18PX
Claims Section (H4)

MERRIWEATHER REGULAR 16PX
1. A method comprising: implementing semantic search across patent databases to identify relevant prior art based on conceptual similarity rather than keyword matching alone.
```

## Typographic Principles

### Alignment

- **Left Alignment**: Primary alignment for most text elements
- **Center Alignment**: Reserved for headings in marketing materials, cards, and certain UI elements
- **Right Alignment**: Used sparingly, primarily for numerical data in tables

### Line Length

- **Optimal**: 50-75 characters per line for body text
- **Maximum**: 90 characters per line
- **Minimum**: 45 characters per line

### Paragraph Spacing

- **Body Text**: 16px (1rem) margin between paragraphs
- **List Items**: 8px (0.5rem) margin between items
- **Headings to Text**: 16px (1rem) margin between heading and following text
- **Text to Heading**: 32px (2rem) margin between text and subsequent heading

### Text Formatting

- **Bold**: Use Montserrat SemiBold or Bold for emphasis
- **Italic**: Use sparingly for specific emphasis or terminology
- **Underline**: Reserved exclusively for links
- **ALL CAPS**: Limited to small UI labels, buttons, and tags
- **Sentence case**: Used for headings, subheadings, and body text

## Responsive Typography

### Fluid Typography

For responsive designs, implement fluid typography using CSS clamp():

```css
:root {
  --h1-font-size: clamp(1.75rem, 1.5rem + 1.5vw, 2rem);
  --h2-font-size: clamp(1.375rem, 1.25rem + 0.75vw, 1.5rem);
  --h3-font-size: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
  --body-font-size: clamp(1rem, 0.9375rem + 0.25vw, 1rem);
}
```

### Breakpoint Adjustments

| Breakpoint | Adjustment |
|------------|------------|
| < 480px | Reduce heading sizes by 10-15% |
| 480px - 768px | Standard mobile typography |
| 768px - 1024px | Standard tablet typography |
| 1024px - 1440px | Standard desktop typography |
| > 1440px | Increase heading sizes by 10-15% for large displays |

## Accessibility Considerations

### Font Size

- Minimum body text size of 16px (1rem)
- Avoid using font sizes smaller than 14px (0.875rem) for any readable text
- Provide text resize options in the application settings

### Line Height

- Minimum line height of 1.5 for body text
- Minimum line height of 1.3 for headings
- Ensure adequate spacing between lines for readability

### Contrast

- Maintain WCAG 2.1 AA standard minimum contrast ratio of 4.5:1 for normal text
- Maintain WCAG 2.1 AA standard minimum contrast ratio of 3:1 for large text (18pt or 14pt bold)

### Font Weight

- Avoid using font weights lighter than Regular (400) for body text
- Use Medium (500) or SemiBold (600) for interactive elements

## Implementation Guidelines

### Web Implementation

```css
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&display=swap');

/* Define variables */
:root {
  --font-primary: 'Montserrat', sans-serif;
  --font-secondary: 'Merriweather', serif;
  
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --h1-font-size: 2rem;
  --h2-font-size: 1.5rem;
  --h3-font-size: 1.25rem;
  --h4-font-size: 1.125rem;
  --h5-font-size: 1rem;
  --h6-font-size: 0.875rem;
  --body-font-size: 1rem;
  --small-font-size: 0.875rem;
}

/* Base typography */
body {
  font-family: var(--font-primary);
  font-weight: var(--font-weight-regular);
  font-size: var(--body-font-size);
  line-height: 1.5;
  color: #2D2E36; /* Patent Black */
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-primary);
  font-weight: var(--font-weight-bold);
  margin-top: 0;
  margin-bottom: 1rem;
  line-height: 1.25;
}

h1 {
  font-size: var(--h1-font-size);
  letter-spacing: -0.5px;
}

h2 {
  font-size: var(--h2-font-size);
  letter-spacing: -0.3px;
}

/* Additional styles for other elements */
```

### Design System Integration

The typography system should be implemented as part of a comprehensive design system with:

1. **Component Library**: Typography styles applied consistently across all UI components
2. **Design Tokens**: Typography variables defined as design tokens for cross-platform consistency
3. **Documentation**: Interactive examples showing typography usage in context
4. **Accessibility Checker**: Automated tools to verify typography meets accessibility standards

## Special Typography Treatments

### Patent Numbers

Patent numbers should be displayed in Montserrat Medium with consistent formatting:
- US patents: US 9,876,543
- European patents: EP 1234567
- International applications: PCT/US2023/012345

### Code Snippets

When displaying code or technical specifications:
- Use a monospace font (Consolas or Monaco)
- Size: 14px (0.875rem)
- Background: Light gray (#F5F5F5)
- Padding: 16px (1rem)
- Border-radius: 4px (0.25rem)

### Data Visualization Labels

- Font: Montserrat Medium
- Size: 12px (0.75rem) minimum
- Color: Patent Black (#2D2E36) or white depending on background
- Avoid rotated text when possible

## Brand-Specific Typography

### Logo Typography

The "EDISON" wordmark in the logo uses a customized version of Montserrat Bold with:
- Slightly increased letter spacing (tracking)
- Modified "E" to echo the filament design
- Balanced weight to complement the light bulb icon

### Eddie Mascot Speech

Text associated with Eddie the mascot character should use:
- Font: Montserrat Medium
- Size: 16px (1rem)
- Line height: 1.4
- Slightly rounded speech bubbles
- Occasional emphasized words in Montserrat Bold

### Marketing Headlines

For marketing materials, headlines may use:
- Larger sizes (up to 48px/3rem)
- More dramatic line height (1.1 to 1.2)
- Strategic use of Edison Blue and Illumination Yellow for emphasis
- Occasional mixing of weights within a headline for emphasis
