"use client";

import { useParams } from "next/navigation";
import OWADetalle from "../../components/owa/OWADetalle";

export default function OWADetallePage() {
  const { id } = useParams();

  return (
    <div>
      <OWADetalle id={id as string} />
    </div>
  );
}
