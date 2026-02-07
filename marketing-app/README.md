# Laya Pro Marketing Website

A modern, animated marketing website built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

- **Modern Design**: Beautiful gradient backgrounds with smooth animations
- **Scroll Animations**: Features reveal as users scroll down the page
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Performance Optimized**: Built with Next.js 14 App Router for optimal performance
- **SEO Ready**: Proper meta tags and semantic HTML for search engines

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The site will be available at [http://localhost:3002](http://localhost:3002)

## 📁 Project Structure

```
marketing-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with navigation
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── Navbar.tsx       # Navigation bar
│   │   ├── Hero.tsx         # Hero section
│   │   ├── Features.tsx     # Features showcase
│   │   ├── HowItWorks.tsx   # Step-by-step guide
│   │   ├── Pricing.tsx      # Pricing plans
│   │   ├── Testimonials.tsx # Customer testimonials
│   │   ├── CTA.tsx          # Call-to-action section
│   │   └── Footer.tsx       # Footer
│   └── lib/
│       └── utils.ts         # Utility functions
├── tailwind.config.ts       # Tailwind configuration
├── next.config.js           # Next.js configuration
└── package.json
```

## 🎨 Sections

1. **Hero**: Eye-catching introduction with animated background
2. **Features**: 12 key features with hover animations
3. **How It Works**: 4-step process guide
4. **Pricing**: 3 pricing tiers with popular plan highlight
5. **Testimonials**: Customer reviews and ratings
6. **CTA**: Final call-to-action for free trial
7. **Footer**: Links and contact information

## 🚀 Deployment

The site is ready to deploy on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- Any platform supporting Node.js

## 📝 Customization

### Update Branding
- Logo: Edit `<Camera />` icon in Navbar and Footer
- Colors: Modify gradient colors in `tailwind.config.ts`
- Content: Update text in each component file

### Add New Sections
1. Create component in `src/components/`
2. Import in `src/app/page.tsx`
3. Add to navigation in `src/components/Navbar.tsx`

## 🔗 Connect with Admin App

Update the CTA button href in `src/components/CTA.tsx`:
```tsx
href="https://app.layapro.com/signup"
```

## 📄 License

MIT License - feel free to use for your projects!
