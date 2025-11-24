import React from "react";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { useLoading } from "@/contexts/LoadingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GridSkeleton, ProductCardSkeleton, TableSkeleton } from "@/components/LoadingSkeletons";

/**
 * Example component demonstrating the loading state management system
 * 
 * Usage patterns:
 * 
 * 1. Using useAsyncOperation hook:
 *    - Automatically handles loading states
 *    - Shows toast notifications on success/error
 *    - Integrates with global loading context
 * 
 * 2. Using useLoading context directly:
 *    - Manually control loading states
 *    - Check if specific operations are loading
 *    - Check if any operation is loading globally
 * 
 * 3. Using skeleton loaders:
 *    - ProductCardSkeleton for product cards
 *    - GridSkeleton for product grids
 *    - TableSkeleton for data tables
 *    - FormSkeleton for forms
 *    - HeroSkeleton for hero sections
 */
const LoadingExample = () => {
  const { isLoading } = useLoading();
  const [data, setData] = React.useState<any>(null);

  // Example async operation with automatic loading state management
  const fetchData = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { items: ["Item 1", "Item 2", "Item 3"] };
  };

  const { execute: loadData, loading } = useAsyncOperation(
    fetchData,
    {
      loadingKey: "example-data",
      successMessage: "Data loaded successfully!",
      errorMessage: "Failed to load data",
      onSuccess: () => {
        setData({ items: ["Item 1", "Item 2", "Item 3"] });
      }
    }
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Loading State Management Examples</CardTitle>
          <CardDescription>
            Comprehensive loading system with skeleton loaders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button 
              onClick={() => loadData()} 
              disabled={loading}
            >
              {loading ? "Loading..." : "Load Data"}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Global loading state: {isLoading("example-data") ? "Loading" : "Idle"}
            </p>
          </div>

          {loading && (
            <div className="space-y-4">
              <h3 className="font-semibold">Loading Skeletons Examples:</h3>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Product Card Skeleton</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Table Skeleton</h4>
                <TableSkeleton rows={3} />
              </div>
            </div>
          )}

          {data && !loading && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Loaded Data:</h3>
              <ul className="list-disc list-inside">
                {data.items.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grid Skeleton Example</CardTitle>
          <CardDescription>
            Shows multiple product card skeletons in a grid layout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => loadData()}>
            Show Grid Loading
          </Button>
          {loading && <GridSkeleton items={6} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingExample;
