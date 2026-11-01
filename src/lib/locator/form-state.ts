import type { PointInput } from "./domain";
export function hasUnsavedChanges(form:PointInput,saved:PointInput){
  return (Object.keys(form) as Array<keyof PointInput>).some(key=>form[key]!==saved[key]);
}
