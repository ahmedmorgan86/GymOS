import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';

// Input is original repository vector artwork; no cropped reference-board assets.
await mkdir('public/icons',{recursive:true});
const icon=await readFile('public/brand/app-icon.svg');
const compact=await readFile('public/brand/compact-icon.svg');
for(const size of [16,24,32,48,64,128,180,192,256,512,1024]){
  await sharp(compact).resize(size,size,{fit:'contain'}).png().toFile(`public/icons/icon-${size}.png`);
}
for(const role of ['main','members','support']){
  await writeFile(`public/icons/brand-${role}.svg`,compact);
  if(role!=='main')for(const size of [180,192,512,1024])await sharp(compact).resize(size,size,{fit:'contain'}).png().toFile(`public/icons/${role}-${size}.png`);
}
await sharp(compact).resize(512,512).flatten({background:'#12101C'}).png().toFile('public/icons/maskable-512.png');
await writeFile('public/favicon.svg',await readFile('public/brand/symbol.svg'));
await sharp(icon).resize(1024,1024).png().toFile('windows/SplashLogo.png');
// ICO directory with multiple PNG-compressed sizes, including native 16/32px.
const sizes=[16,24,32,48,64,128,256];
const images=await Promise.all(sizes.map(size=>sharp(compact).resize(size,size).png().toBuffer()));
const directory=Buffer.alloc(6+16*sizes.length);directory.writeUInt16LE(1,2);directory.writeUInt16LE(sizes.length,4);
let offset=directory.length;
images.forEach((png,i)=>{const p=6+16*i;directory[p]=sizes[i]===256?0:sizes[i];directory[p+1]=directory[p];directory.writeUInt16LE(1,p+4);directory.writeUInt16LE(32,p+6);directory.writeUInt32LE(png.length,p+8);directory.writeUInt32LE(offset,p+12);offset+=png.length;});
const ico=Buffer.concat([directory,...images]);
await writeFile('public/favicon.ico',ico);await writeFile('windows/GymOS.ico',ico);
for(const variant of ['dark','light','mono','print'])await sharp(`public/brand/logo-${variant}.svg`).resize(1570).png().toFile(`public/brand/logo-${variant}.png`);
console.log('GymEG SVG, transparent PNG, PWA icons, favicon and Windows artwork generated.');

for(const variant of ['dark','light','mono','print'])for(const layout of ['vertical','square'])await sharp(`public/brand/logo-${layout}-${variant}.svg`).resize(1024).png().toFile(`public/brand/logo-${layout}-${variant}.png`);
for(const folder of ['mobile-android/members','mobile-android/management','android','android-management','android-support']){
 await sharp(icon).resize(512).png().toFile(`${folder}/res/drawable/logo.png`);
 for(const [density,size]of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]]){await mkdir(`${folder}/res/mipmap-${density}`,{recursive:true});await sharp(compact).resize(size).png().toFile(`${folder}/res/mipmap-${density}/ic_launcher.png`);}
}
