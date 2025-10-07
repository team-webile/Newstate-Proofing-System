# Loading Component Usage Guide

This document shows how to use the centralized loading components throughout the website.

## Available Components

### 1. `FullScreenLoading`
For full-screen loading states (like page transitions)

```tsx
import { FullScreenLoading } from '@/components/ui/loading'

// In Suspense fallback
<Suspense fallback={<FullScreenLoading text="Loading page..." />}>
  <YourComponent />
</Suspense>
```

### 2. `CardLoading`
For loading states within cards or containers

```tsx
import { CardLoading } from '@/components/ui/loading'

// Inside a card or container
<Card>
  <CardContent>
    {isLoading ? <CardLoading text="Loading data..." /> : <YourContent />}
  </CardContent>
</Card>
```

### 3. `InlineLoading`
For small inline loading states

```tsx
import { InlineLoading } from '@/components/ui/loading'

// Small loading indicator
<div className="flex items-center gap-2">
  <InlineLoading size="sm" />
  <span>Processing...</span>
</div>
```

### 4. `ButtonLoading`
For loading states inside buttons

```tsx
import { ButtonLoading } from '@/components/ui/loading'

<Button disabled={isLoading}>
  {isLoading ? <ButtonLoading /> : "Submit"}
</Button>
```

### 5. `PageLoading`
For page-level loading states

```tsx
import { PageLoading } from '@/components/ui/loading'

// When loading entire page content
if (isLoading) {
  return <PageLoading text="Loading dashboard..." />
}
```

## Custom Loading Component

For more control, use the base `Loading` component:

```tsx
import { Loading } from '@/components/ui/loading'

<Loading 
  size="lg" 
  text="Custom loading message" 
  variant="dots" 
  className="custom-class"
  fullScreen={true}
/>
```

## Props

- `size`: "sm" | "md" | "lg" | "xl" - Size of the loading indicator
- `text`: string - Loading message text
- `className`: string - Additional CSS classes
- `fullScreen`: boolean - Whether to show full screen loading
- `variant`: "default" | "minimal" | "dots" | "pulse" - Loading animation style

## Examples by Use Case

### Page Transitions
```tsx
<Suspense fallback={<FullScreenLoading text="Loading login page..." />}>
  <LoginPage />
</Suspense>
```

### Data Loading in Tables
```tsx
{isLoading ? (
  <CardLoading text="Loading projects..." />
) : (
  <ProjectsTable data={projects} />
)}
```

### Form Submissions
```tsx
<Button disabled={isSubmitting}>
  {isSubmitting ? (
    <div className="flex items-center gap-2">
      <ButtonLoading />
      Submitting...
    </div>
  ) : (
    "Submit"
  )}
</Button>
```

### Small Inline States
```tsx
<div className="flex items-center gap-2">
  <span>Status:</span>
  {isChecking ? <InlineLoading size="sm" /> : <span>Ready</span>}
</div>
```

## Benefits

1. **Consistency**: All loading states look the same across the website
2. **Maintainability**: Update loading styles in one place
3. **Accessibility**: Proper loading indicators for screen readers
4. **Performance**: Lightweight and optimized animations
5. **Flexibility**: Multiple variants and sizes for different use cases

## Migration

To migrate existing loading states:

1. Replace custom loading spinners with appropriate loading components
2. Update text to be consistent with the design system
3. Use the right component for the context (full screen vs inline)
4. Remove custom CSS for loading animations
