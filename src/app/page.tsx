import Map from "./Map";
import { envobj, string } from "envobj";

export const env = envobj(
  {
    MAPBOX_ACCESS_TOKEN: string,
  },
  process.env as Record<string, string | undefined>
);

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main>
        <Map token={env.MAPBOX_ACCESS_TOKEN} />
      </main>
    </div>
  );
}
