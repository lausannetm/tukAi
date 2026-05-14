import { CatalogPage } from "@/components/catalog-page";
import { submitOrderForm } from "@/app/order-actions";
import { loadCatalogContext } from "@/lib/catalog-load";

const DEMO_USER_ID = "11111111-1111-4111-8111-111111111111";

export default async function OrderRoute(): Promise<JSX.Element> {
  const ctx = await loadCatalogContext();

  return (
    <CatalogPage
      services={ctx.services}
      loadError={ctx.loadError}
      swaggerUrl={ctx.swaggerUrl}
      publicOrigin={ctx.publicOrigin}
      demoUserId={DEMO_USER_ID}
      submitOrderForm={submitOrderForm}
      showServices={false}
      showOrderForm
    />
  );
}
