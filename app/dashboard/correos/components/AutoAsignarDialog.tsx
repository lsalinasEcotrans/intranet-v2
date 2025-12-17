import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

interface AutoAsignarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string | undefined;
  loading: boolean;
}

export default function AutoAsignarDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  loading,
}: AutoAsignarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Deseas autoasignar este correo a ti mismo?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          El correo será marcado como "En proceso" y asignado a{" "}
          <strong>{userName}</strong>
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              "Sí, autoasignar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
