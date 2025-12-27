import { SodaClient } from "soda3-query";

export enum ResourceId {
  SERVICE_REQUESTS = "vw6y-z8j6",
}

const sfdataClient = new SodaClient({
  domain: "data.sfgov.org",
});

export default sfdataClient;
