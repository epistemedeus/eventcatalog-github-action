'use strict';
const net=require('node:net'),dns=require('node:dns');
const hosts=new Set(['127.0.0.1','::1','localhost']);
function allowed(host){return typeof host==='string'&&hosts.has(host.replace(/^\[|\]$/g,''));}
function deny(){const e=new Error('ROOT4778_LOOPBACK_ONLY');e.code='EACCES';throw e;}
const connect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){let a=args;if(Array.isArray(a[0]))a=a[0];
 const o=typeof a[0]==='object'&&a[0]!==null?a[0]:{port:a[0],host:typeof a[1]==='string'?a[1]:'localhost'};
 if(o.path||!allowed(o.host??o.hostname??'localhost'))deny();return connect.apply(this,args);};
const lookup=dns.lookup;dns.lookup=function(host,...args){if(!allowed(host))deny();
 return lookup.call(this,host,...args);};
if(globalThis.fetch){const original=globalThis.fetch;globalThis.fetch=function(input,...args){
 const u=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(!allowed(u.hostname))deny();return original.call(this,input,...args);};}
