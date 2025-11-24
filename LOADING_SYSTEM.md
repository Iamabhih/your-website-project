# Loading State Management System

A comprehensive loading state management system with skeleton loaders for better UX.

## Features

✅ **Global Loading Context** - Manage loading states across your entire application  
✅ **Skeleton Loaders** - Pre-built skeleton components for common UI patterns  
✅ **Async Operation Hook** - Simplified async operations with automatic loading states  
✅ **Toast Integration** - Built-in success/error notifications  
✅ **Type-Safe** - Full TypeScript support

## Quick Start

### 1. Using the Async Operation Hook

The `useAsyncOperation` hook automatically manages loading states and shows notifications:

```tsx
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { Button } from "@/components/ui/button";

const MyComponent = () => {
  const fetchData = async () => {
    const response = await fetch("/api/data");
    return response.json();
  };

  const { execute, loading } = useAsyncOperation(fetchData, {
    loadingKey: "my-data",
    successMessage: "Data loaded!",
    errorMessage: "Failed to load data",
    onSuccess: () => {
      // Handle success
    }
  });

  return (
    <Button onClick={() => execute()} disabled={loading}>
      {loading ? "Loading..." : "Load Data"}
    </Button>
  );
};
```

### 2. Using the Loading Context

For manual control over loading states:

```tsx
import { useLoading } from "@/contexts/LoadingContext";

const MyComponent = () => {
  const { setLoading, isLoading } = useLoading();

  const handleAction = async () => {
    setLoading("my-action", true);
    try {
      await someAsyncOperation();
    } finally {
      setLoading("my-action", false);
    }
  };

  return (
    <div>
      {isLoading("my-action") && <p>Loading...</p>}
      <button onClick={handleAction}>Do Something</button>
    </div>
  );
};
```

### 3. Using Skeleton Loaders

Display skeleton loaders while content is loading:

```tsx
import { ProductCardSkeleton, GridSkeleton } from "@/components/LoadingSkeletons";
import { useLoading } from "@/contexts/LoadingContext";

const ProductList = () => {
  const { isLoading } = useLoading();
  const products = useProducts(); // Your data fetching

  if (isLoading("products")) {
    return <GridSkeleton items={8} />;
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

## Available Skeleton Components

### ProductCardSkeleton
Skeleton for product cards with image, title, description, and button.

```tsx
<ProductCardSkeleton />
```

### ProductDetailSkeleton
Skeleton for product detail pages with large image and description area.

```tsx
<ProductDetailSkeleton />
```

### OrderCardSkeleton
Skeleton for order cards with header and content areas.

```tsx
<OrderCardSkeleton />
```

### TableSkeleton
Skeleton for data tables with customizable row count.

```tsx
<TableSkeleton rows={5} />
```

### HeroSkeleton
Skeleton for hero sections with centered content.

```tsx
<HeroSkeleton />
```

### FormSkeleton
Skeleton for forms with multiple input fields.

```tsx
<FormSkeleton />
```

### GridSkeleton
Grid layout of product card skeletons with customizable items and columns.

```tsx
<GridSkeleton items={8} />
```

## API Reference

### useAsyncOperation

```tsx
const { execute, loading, error } = useAsyncOperation(
  operation,
  {
    loadingKey?: string;        // Key for global loading state
    onSuccess?: () => void;     // Success callback
    onError?: (error: Error) => void;  // Error callback
    successMessage?: string;    // Toast success message
    errorMessage?: string;      // Toast error message
  }
);
```

### useLoading

```tsx
const {
  loadingStates,              // Object of all loading states
  setLoading,                 // Set loading state for a key
  isLoading,                  // Check if specific key is loading
  isAnyLoading               // Check if any operation is loading
} = useLoading();
```

## Best Practices

1. **Use unique loading keys** - Prevent conflicts by using descriptive, unique keys
   ```tsx
   loadingKey: "fetch-user-profile"  // ✅ Good
   loadingKey: "loading"             // ❌ Too generic
   ```

2. **Show skeletons immediately** - Don't wait for the loading state
   ```tsx
   // ✅ Good
   if (!data) return <ProductCardSkeleton />;
   
   // ❌ Bad - shows blank screen briefly
   if (loading) return <ProductCardSkeleton />;
   ```

3. **Match skeleton to content** - Use skeleton that matches your actual content structure
   ```tsx
   // For a grid of products
   <GridSkeleton items={8} />
   
   // For a single product detail page
   <ProductDetailSkeleton />
   ```

4. **Combine with error handling** - Show appropriate feedback for errors
   ```tsx
   if (error) return <ErrorMessage />;
   if (loading) return <Skeleton />;
   return <Content data={data} />;
   ```

## Examples

See `src/components/LoadingExample.tsx` for complete working examples.

## Integration with Existing Code

### Example: Product List Page

```tsx
import { useQuery } from "@tanstack/react-query";
import { GridSkeleton } from "@/components/LoadingSkeletons";
import { supabase } from "@/integrations/supabase/client";

const ProductsPage = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*");
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <GridSkeleton items={8} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-4 gap-6">
        {products?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
```

### Example: Form Submission

```tsx
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { supabase } from "@/integrations/supabase/client";

const ContactForm = () => {
  const submitForm = async (data: FormData) => {
    await supabase.from("contacts").insert(data);
  };

  const { execute, loading } = useAsyncOperation(submitForm, {
    loadingKey: "submit-contact",
    successMessage: "Message sent successfully!",
    errorMessage: "Failed to send message"
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      execute(Object.fromEntries(formData));
    }}>
      {/* form fields */}
      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
};
```

## Troubleshooting

**Loading state not updating?**
- Ensure you're using the same `loadingKey` when checking the state
- Verify the `LoadingProvider` wraps your components in `App.tsx`

**Skeleton not showing?**
- Check that you're conditionally rendering based on the loading state
- Ensure the skeleton component is imported correctly

**Toast not appearing?**
- Verify that `Toaster` components are included in your `App.tsx`
- Check that the `successMessage` or `errorMessage` props are provided
