import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const ProductCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="w-full h-48" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-full mt-4" />
      </CardContent>
    </Card>
  );
};

export const ProductDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="w-full h-96 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
};

export const OrderCardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-28 mt-4" />
        </div>
      </CardContent>
    </Card>
  );
};

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
};

export const HeroSkeleton = () => {
  return (
    <div className="relative h-[500px] flex items-center justify-center">
      <Skeleton className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 text-center space-y-4 px-4">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-12 w-40 mx-auto" />
      </div>
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
};

export const GridSkeleton = ({ 
  items = 8, 
  columns = 4 
}: { 
  items?: number; 
  columns?: number 
}) => {
  return (
    <div 
      className={`grid gap-6`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))`
      }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};
