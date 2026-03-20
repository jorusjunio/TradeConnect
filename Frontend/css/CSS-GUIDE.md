# TradeConnect CSS Architecture Guide

## 📁 File Structure

```
frontend/css/
├── variables.css      # CSS custom properties (colors, spacing, fonts)
├── base.css          # Reset, typography, global styles
├── components.css    # Buttons, cards, forms, tags, reusable components
├── layout.css        # Navbar, footer, containers, sections, grid
├── pages.css         # Page-specific styles (feed, profile, explore)
└── responsive.css    # Media queries for all breakpoints
```

## 🔗 How to Include in HTML

**Add these in order in your `<head>` section:**

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TradeConnect</title>
    
    <!-- CSS Files - Load in this specific order -->
    <link rel="stylesheet" href="../css/variables.css">
    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="../css/components.css">
    <link rel="stylesheet" href="../css/layout.css">
    <link rel="stylesheet" href="../css/pages.css">
    <link rel="stylesheet" href="../css/responsive.css">
</head>
```

## 📋 What Each File Contains

### 1. **variables.css**
- Color palette (primary, secondary, grays)
- Spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)
- Border radius values
- Shadows
- Typography settings (font sizes, weights, line heights)
- Transitions
- Z-index scale

### 2. **base.css**
- CSS reset
- Global HTML/body styles
- Typography (h1-h6, p, links)
- Utility classes (.text-center, .fw-bold, .mt-lg, etc.)

### 3. **components.css**
- Buttons (.btn-primary, .btn-secondary, .btn-google, etc.)
- Forms (.form-group, inputs, textareas, selects)
- Cards (.card, .post-card, .feature-card, .market-card)
- Avatars (.avatar, .avatar-sm, .avatar-lg)
- Tags (.tag, .tag-primary, .tag-success)
- Links (.link-text, .link-primary)
- Dividers
- Stats components

### 4. **layout.css**
- Containers (.container, .container-sm)
- Navbar (.navbar, .nav-brand, .nav-links)
- Hero section (.hero, .hero-title, .hero-cta)
- Sections (.section, .section-title)
- Footer (.footer, .footer-content, .footer-bottom)
- Auth pages layout (.auth-section, .auth-card, .auth-info)
- Feed layout (.feed-container)
- Profile layout (.profile-header, .profile-info, .profile-stats)
- Grid utilities (.grid, .grid-2, .grid-3, .grid-4)
- Flex utilities (.flex, .flex-center, .flex-between)

### 5. **pages.css**
- Landing page specific styles
- Feed page (create post box, comments)
- Profile page (tabs, posts grid)
- Explore page (search bar, filters, trader cards)
- Empty states
- Loading states
- Notifications

### 6. **responsive.css**
- Breakpoints:
  - 1024px (tablet & below)
  - 768px (tablet)
  - 480px (mobile)
  - 360px (small mobile)
- Landscape mobile adjustments
- Print styles
- Reduced motion support
- Dark mode placeholder

## 🎨 Using CSS Variables

You can use any of the CSS variables defined in `variables.css`:

```css
/* Example usage */
.my-custom-class {
    color: var(--primary-color);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
}
```

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px (default)
- **Tablet**: 768px - 1024px
- **Mobile**: 480px - 768px
- **Small Mobile**: < 480px

## ✅ Best Practices

1. **Always load files in order** (variables → base → components → layout → pages → responsive)
2. **Don't modify variables.css** - use it as your design system
3. **Add new components** to components.css
4. **Page-specific styles** go in pages.css
5. **Layout changes** go in layout.css
6. **Mobile adjustments** go in responsive.css

## 🔧 Adding Custom Styles

If you need custom styles:

```css
/* Add to pages.css for page-specific */
.my-special-page-element {
    /* styles */
}

/* Add to components.css for reusable */
.my-reusable-component {
    /* styles */
}
```

## 🎯 Common Class Combinations

```html
<!-- Primary button -->
<button class="btn-primary">Click Me</button>

<!-- Large full-width button -->
<button class="btn-primary btn-large btn-full">Submit</button>

<!-- Card with content -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Title</h3>
    </div>
    <div class="card-body">
        Content here
    </div>
</div>

<!-- Centered flex container -->
<div class="flex flex-center gap-lg">
    <span>Item 1</span>
    <span>Item 2</span>
</div>
```

## 📊 File Sizes (Approximate)

- variables.css: ~3KB
- base.css: ~2KB
- components.css: ~10KB
- layout.css: ~8KB
- pages.css: ~7KB
- responsive.css: ~6KB
- **Total: ~36KB** (vs ~50KB+ in single file)

## 🚀 Performance Tips

1. Files load in parallel = faster than one large file
2. Browser can cache individual files
3. Easy to maintain and update specific sections
4. Team members can work on different files without conflicts

---

**Questions?** Check the comments in each CSS file for more details!
