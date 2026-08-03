import { SettingsClient } from "@/components/settings/settings-client";
import { getConfigurationAction } from "@/actions/settings/configuration.actions";
import { DEFAULT_RCMS_CONFIG } from "@/services/settings/configuration.service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const configRes = await getConfigurationAction();
  const initialConfig = configRes.success && configRes.data ? configRes.data : DEFAULT_RCMS_CONFIG;

  return <SettingsClient initialConfig={initialConfig} />;
}
