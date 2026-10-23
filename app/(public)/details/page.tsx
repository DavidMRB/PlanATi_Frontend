import { redirect } from "next/navigation";

// Compatibilidad: /details?id=N redirige a la ficha pública; sin id, al directorio.
export default async function DetailsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const establishmentId = Number(id);

  if (Number.isInteger(establishmentId) && establishmentId > 0) {
    redirect(`/establishments/${establishmentId}`);
  }
  redirect("/explore");
}
