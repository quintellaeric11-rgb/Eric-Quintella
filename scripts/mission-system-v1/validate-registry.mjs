import{validateRegistry}from'../../lib/mission-system-v1/registry-validator.mjs';const result=validateRegistry();console.log(JSON.stringify(result,null,2));if(!result.valid)process.exitCode=1;
