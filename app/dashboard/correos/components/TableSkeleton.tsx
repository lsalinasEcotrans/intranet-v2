import { Skeleton } from "@/components/ui/skeleton";

export default function TableSkeleton() {
  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-white p-4 shadow-sm space-y-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="flex items-center gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
      ))}
    </div>
  );
}
