import { UserManager } from "./UserManager";

const STORAGE_LOCATION = "../config/stalkyboi_storage.json";

export default {
  userManager: new UserManager(STORAGE_LOCATION),
};
