import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ negocioId: string }>;
};

/**
 * Enlace corto para compartir (bio de Instagram, WhatsApp, etc.).
 * Redirige al flujo público de reserva del negocio.
 */
export default async function PublicBookShortcutPage({ params }: PageProps) {
  const { negocioId } = await params;
  const id = decodeURIComponent(String(negocioId ?? "")).trim();
  if (!id) {
    redirect("/businesses");
  }
  redirect(`/businesses/${id}/book`);
}
