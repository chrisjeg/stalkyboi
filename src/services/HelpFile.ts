import { readFileSync } from "fs";
import path from "path";

export default class HelpFile {
  private fileContents: string;

  constructor(location: string) {
    this.fileContents = readFileSync(location, "utf8");
  }

  get() {
    return this.fileContents;
  }
}
