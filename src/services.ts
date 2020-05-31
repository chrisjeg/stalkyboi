import { UserManager } from "./services/UserManager";
import HelpFile from "./services/HelpFile";

const STORAGE_LOCATION = "../config/stalkyboi_storage.json";
const HELP_FILE_LOCATION = "./HELP.md";

export default {
  userManager: new UserManager(STORAGE_LOCATION),
  helpFile: new HelpFile(HELP_FILE_LOCATION),
};
