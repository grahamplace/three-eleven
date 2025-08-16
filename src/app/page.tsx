import { getLatestUpdatedDatetime } from "@/store/metadata";
import "server-only";
import { unstable_noStore } from "next/cache";
import Map from "@/components/Map";
import { envobj, string } from "envobj";

const env = envobj(
  {
    MAPBOX_ACCESS_TOKEN: string,
  },
  process.env as Record<string, string | undefined>
);

export default async function Page() {
  unstable_noStore();
  const dataAsOf = await getLatestUpdatedDatetime();
  return (
    <div className="min-h-screen w-[100vw] flex items-center justify-center">
      <main className="w-full h-full">
        <Map token={env.MAPBOX_ACCESS_TOKEN} dataAsOf={dataAsOf} />
      </main>
    </div>
  );
}
