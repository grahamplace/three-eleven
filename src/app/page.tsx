import Map from "./Map";
import { envobj, string } from "envobj";

const env = envobj(
  {
    MAPBOX_ACCESS_TOKEN: string,
  },
  process.env as Record<string, string | undefined>
);

export default function Home() {
  return (
    <div className="min-h-screen w-[100vw] flex items-center justify-center">
      <main className="w-full h-full">
        <Map token={env.MAPBOX_ACCESS_TOKEN} />
      </main>
    </div>
  );
}
