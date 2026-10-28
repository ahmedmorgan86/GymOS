export const themes = [
 {id:'violet',ar:'GYMEG الداكن',en:'GYMEG Dark',accent:'#7C3AED',bg:'#12101C',surface:'#1B1729',text:'#F5F3FF',dark:true},
 {id:'pushtorq-light',ar:'GYMEG النهاري',en:'GYMEG Light',accent:'#7C3AED',bg:'#F5F3FF',surface:'#FFFFFF',text:'#21172F',dark:false},
 {id:'ocean',ar:'المحيط',en:'Ocean',accent:'#087da2',bg:'#eef7fb',surface:'#ffffff',text:'#173447',dark:false},
 {id:'emerald',ar:'زمرد',en:'Emerald',accent:'#16774c',bg:'#f0f8f3',surface:'#ffffff',text:'#20382c',dark:false},
 {id:'sunset',ar:'الغروب',en:'Sunset',accent:'#b54d21',bg:'#fff5ed',surface:'#ffffff',text:'#422c23',dark:false},
 {id:'rose',ar:'وردي',en:'Rose',accent:'#b23c69',bg:'#fff2f6',surface:'#ffffff',text:'#422637',dark:false},
 {id:'slate',ar:'رمادي هادئ',en:'Slate',accent:'#456381',bg:'#f0f3f7',surface:'#ffffff',text:'#243444',dark:false},
 {id:'sand',ar:'رمال',en:'Sand',accent:'#8a6226',bg:'#faf5e9',surface:'#fffdf7',text:'#3e3525',dark:false},
 {id:'midnight',ar:'منتصف الليل',en:'Midnight',accent:'#A855F7',bg:'#12101C',surface:'#1B1729',text:'#F5F3FF',dark:true},
 {id:'abyss',ar:'أعماق',en:'Abyss',accent:'#64c8ee',bg:'#0d1a25',surface:'#162b3a',text:'#e8f4fc',dark:true},
 {id:'forest',ar:'الغابة',en:'Forest',accent:'#70d5a0',bg:'#101f19',surface:'#1b3027',text:'#eaf8ef',dark:true},
 {id:'ember',ar:'جمر',en:'Ember',accent:'#ffb185',bg:'#241914',surface:'#35251e',text:'#fff1e7',dark:true},
 {id:'plum',ar:'برقوق',en:'Plum',accent:'#e4a0e9',bg:'#211426',surface:'#322039',text:'#f9ecfa',dark:true},
 {id:'graphite',ar:'جرافيت',en:'Graphite',accent:'#b6c9e2',bg:'#171b20',surface:'#262c34',text:'#f0f3f8',dark:true},
 {id:'neon',ar:'نيون',en:'Neon',accent:'#bfdf66',bg:'#161c13',surface:'#252e20',text:'#eff8e5',dark:true},
 {id:'black-yellow',ar:'أسود وأصفر',en:'Black & Yellow',accent:'#FACC15',bg:'#090909',surface:'#171717',text:'#FAFAFA',dark:true}
] as const;
export type ThemeId=typeof themes[number]['id'];
export function validTheme(value:unknown):value is ThemeId{return themes.some(t=>t.id===value);}
