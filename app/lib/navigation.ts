export const WORKSPACE_PATH='/?workspace=1';
export function workspaceRequested(query:Record<string,string|string[]|undefined>){return query.workspace==='1';}
