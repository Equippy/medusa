import { Module } from "@medusajs/framework/utils";
import DespatchLabService from "./service";

export const DESPATCH_LAB_MODULE = "despatch_lab";

export default Module(DESPATCH_LAB_MODULE, {
  service: DespatchLabService,
});
