import { Module } from "@medusajs/framework/utils";
import DespatchLabModuleService from "./service";

export const DESPATCH_LAB_MODULE = "despatch-lab";

export default Module(DESPATCH_LAB_MODULE, {
  service: DespatchLabModuleService,
});