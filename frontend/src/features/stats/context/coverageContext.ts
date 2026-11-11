import { createContext } from "react";
import type { Coverage } from "../filters";

export const CoverageContext = createContext<Coverage>(null);
