import { CatalogPage } from "@/components/catalog-page";
import { submitOrderForm } from "@/app/order-actions";
import {
  filterServicesByQuery,
  loadCatalogContext,
} from "@/lib/catalog-load";

const DEMO_USER_ID = "11111111-1111-4111-8111-111111111111";

type CatalogRouteProps = {
  searchParams?: Promise<{ q?: string; suggested?: string }>;
};

export default async function CatalogRoute(
  props: CatalogRouteProps
): Promise<JSX.Element> {
  const sp = (await props.searchParams) ?? {};
  const q = sp.q;
  const suggestedRaw = sp.suggested?.trim() ?? "";

  const ctx = await loadCatalogContext();
  const filtered = filterServicesByQuery(ctx.services, q);
  const suggestedRow =
    suggestedRaw.length > 0
      ? ctx.services.find((s) => s.id === suggestedRaw)
      : undefined;
  const servicesForTable =
    suggestedRow && !filtered.some((s) => s.id === suggestedRow.id)
      ? [...filtered, suggestedRow]
      : filtered;

  return (
    <CatalogPage
      services={servicesForTable}
      loadError={ctx.loadError}
      swaggerUrl={ctx.swaggerUrl}
      publicOrigin={ctx.publicOrigin}
      demoUserId={DEMO_USER_ID}
      submitOrderForm={submitOrderForm}
      showServices
      showOrderForm={false}
      suggestedServiceId={suggestedRow?.id}
      highlightServiceId={suggestedRow?.id}
    />
  );
}
