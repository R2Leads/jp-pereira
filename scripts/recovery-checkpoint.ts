export type QueryCheckpoint={id:number;status:"accepted"|"rejected"|"temporary_error"};
export type ApplicationCheckpoint={id:number;status:"active"|"conflict"|"failed"};
export const completedQueryIds=(entries:QueryCheckpoint[])=>new Set(entries.filter(entry=>entry.status!=="temporary_error").map(entry=>entry.id));
export const completedApplicationIds=(entries:ApplicationCheckpoint[])=>new Set(entries.filter(entry=>entry.status!=="failed").map(entry=>entry.id));
export const upsertCheckpoint=<T extends {id:number}>(entries:T[],entry:T):T[]=>[...entries.filter(previous=>previous.id!==entry.id),entry];
