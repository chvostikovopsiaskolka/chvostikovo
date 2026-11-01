import {readFileSync} from 'node:fs';import vm from 'node:vm';
const html=readFileSync(process.env.ADMIN_SOURCE,'utf8');
let count=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/src=|type=["'](?:module|application\/)/i.test(m[1])||!m[2].trim())continue;try{new vm.Script(m[2]);count++;}catch(e){throw Error('Inline script '+count+': '+e.message)}}console.log('Assembled admin syntax PASS: '+count+' inline scripts; runtime and authenticated flows pending');
