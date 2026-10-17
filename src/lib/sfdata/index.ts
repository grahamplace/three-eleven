import { SodaClient } from "soda3-query";

export enum ResourceId {
  SERVICE_REQUESTS = "vw6y-z8j6",
}

const sfdataClient = new SodaClient({
  // data.sfgov.org now redirects here; skip the extra hop on every page.
  domain: "data.sf.gov",
});

export default sfdataClient;
