import test from "node:test";
import assert from "node:assert/strict";
import {completedQueryIds,completedApplicationIds,upsertCheckpoint,type QueryCheckpoint,type ApplicationCheckpoint} from "../scripts/recovery-checkpoint.ts";
test("uma falha temporária continua elegível para consulta na retomada",()=>{
 const entries:QueryCheckpoint[]=[{id:1,status:"accepted"},{id:2,status:"rejected"},{id:3,status:"temporary_error"}];
 assert.deepEqual([...completedQueryIds(entries)],[1,2]);
 const next=upsertCheckpoint<QueryCheckpoint>(entries,{id:3,status:"accepted"});
 assert.equal(next.length,3);assert.deepEqual([...completedQueryIds(next)],[1,2,3]);
 assert.equal(entries[2].status,"temporary_error");
});
test("falha de confirmação pode ser repetida sem repetir ativados ou sobrescrever conflitos",()=>{
 const entries:ApplicationCheckpoint[]=[{id:1,status:"active"},{id:2,status:"failed"},{id:3,status:"conflict"}];
 assert.deepEqual([...completedApplicationIds(entries)],[1,3]);
 const next=upsertCheckpoint<ApplicationCheckpoint>(entries,{id:2,status:"active"});
 assert.equal(next.length,3);assert.equal(next.filter(item=>item.id===2).length,1);
 assert.equal(completedApplicationIds(next).has(2),true);
});
