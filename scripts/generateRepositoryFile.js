import fs from "fs";
import { list } from "../dist/index.js";

const data = list();
fs.writeFileSync("repository/all.json", JSON.stringify(data, null, 2));
