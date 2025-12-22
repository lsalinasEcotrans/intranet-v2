"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EllipsisVertical } from "lucide-react";

interface ConvenioFieldProps {
  value: string;
  onOpenDialog: () => void;
}

export default function ConvenioField({
  value,
  onOpenDialog,
}: ConvenioFieldProps) {
  return (
    <div className="w-full max-w-xl space-y-2">
      <Label>Convenio:</Label>
      <div className="flex rounded-md shadow-xs">
        <Input
          value={value ?? ""}
          readOnly
          placeholder="Convenio"
          className="-me-px rounded-r-none shadow-none focus-visible:z-1 bg-muted"
        />
        <Button className="rounded-l-none" onClick={onOpenDialog}>
          <EllipsisVertical />
        </Button>
      </div>
    </div>
  );
}
