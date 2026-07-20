import { useContext } from "react";
import { FinancialContext } from "./financial-context";

export const useFinancialSettings = () => useContext(FinancialContext);
