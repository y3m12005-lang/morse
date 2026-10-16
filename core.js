export const MORSE = Object.freeze({A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.','.':'.-.-.-',',':'--..--','?':'..--..',"'":'.----.','-':'-....-','/':'-..-.','(':'-.--.',')':'-.--.-','"':'.-..-.','=':'-...-','+':'.-.-.','@':'.--.-.'});
export const GROUPS = [
 ['ET','Your first signals','A short beep. A long beep. Your first two letters.'],
 ['IM','Double the rhythm','Hear two short sounds and two long sounds.'],
 ['AN','Turn it around','The same two sounds, in a different order.'],
 ['SO','Three of a kind','Recognize a complete rhythm instead of counting.'],
 ['RK','Find the middle','Listen for the sound in the middle.'],
 ['DU','Short meets long','Keep the whole pattern in your ear.'],
 ['WG','Mirror patterns','A new pair, plus a little review.'],
 ['HV','One small difference','Four sounds. Listen for the ending.'],
 ['BF','Build your vocabulary','Longer signals, with room to think.'],
 ['LP','Hear the shape','Turn familiar sounds into automatic recognition.'],
 ['CJ','Stay with the rhythm','Listen all the way through before you answer.'],
 ['QXYZ','Complete your alphabet','The final four letters. You have come a long way.'],
 ['12345','Numbers, part one','A steady five-element pattern.'],
 ['67890','Numbers, part two','Bring all ten digits into your listening vocabulary.'],
 ['.,?/-','Everyday punctuation','Give your messages structure.'],
 ['@:+','More useful signs','The @ sign, plus, and colon.'],
];
// Colon is defined by ITU M.1677 alongside the other punctuation.
export const CODE = Object.freeze({...MORSE, ':':'---...'});
export const LESSONS = [
 ...GROUPS.map((g,id)=>({id,chars:g[0],title:g[1],description:g[2],stage:id<4?'First steps':id<12?'The alphabet':'Numbers & signs',type:'letters'})),
 {id:16,chars:'',title:'Your first words',description:'Recognize letter boundaries. Decode short words with breathing room.',stage:'Real listening',type:'words',words:['ME','TEN','SUN','HOME','RADIO','HELLO','YES','NO','CODE','TIME']},
 {id:17,chars:'',title:'Listen without looking',description:'Audio only. Recognize short words without the dot-and-dash guide.',stage:'Real listening',type:'ears',words:['YES','NO','HI','SUN','AIR','MAP','ONE','TWO','RED','SEA']},
 {id:18,chars:'',title:'A message for you',description:'Copy short messages. Spaces between words help you follow along.',stage:'Real listening',type:'phrases',words:['HELLO WORLD','GOOD DAY','SEE YOU','I AM HERE','ALL IS WELL','YES I CAN','SEND MORE','NICE WORK','WE ARE READY','THANK YOU']},
 {id:19,chars:'',title:'The listening studio',description:'Mixed letters and numbers, no visual clues. Repeat at faster speeds when you are ready.',stage:'Real listening',type:'final'},
 {id:20,chars:'',title:'Words that connect',description:'Build fluency with useful five- and six-letter words.',stage:'Advanced',type:'words',words:['LISTEN', 'SIGNAL', 'FRIEND', 'PLEASE', 'THANKS', 'MORNING', 'LEARN', 'READY', 'WORLD', 'AGAIN']},
 {id:21,chars:'',title:'Everyday sentences',description:'Find the word gaps in small, useful sentences.',stage:'Advanced',type:'phrases',words:['HOW ARE YOU', 'I AM FINE', 'NICE TO MEET YOU', 'HAVE A GOOD DAY', 'SEE YOU SOON', 'WHAT IS YOUR NAME', 'MY NAME IS SAM', 'PLEASE TRY AGAIN', 'THANK YOU VERY MUCH', 'I AM LEARNING MORSE']},
 {id:22,chars:'',title:'Details in the signal',description:'Listen for numbers and punctuation in practical messages.',stage:'Advanced',type:'phrases',words:['MEET AT 10', 'ROOM 25', 'ARRIVE AT 9:30', 'BRING 2 MAPS', 'GO TO GATE 4', 'YES, I AM READY.', 'ARE YOU THERE?', 'SEND 3 SIGNALS', 'THE CODE IS 72', 'WAIT 5 MINUTES']},
 {id:23,chars:'',title:'Words by ear',description:'Recognize longer words with the symbols hidden.',stage:'Advanced',type:'ears',words:['MESSAGE', 'STATION', 'PRACTICE', 'TOMORROW', 'TOGETHER', 'WELCOME', 'LISTENING', 'LANGUAGE', 'PATIENCE', 'CONFIDENCE']},
 {id:24,chars:'',title:'Conversation by ear',description:'Copy complete sentences without visual clues.',stage:'Advanced',type:'ears',words:['CAN YOU HEAR ME', 'I CAN HEAR YOU', 'THE SIGNAL IS CLEAR', 'PLEASE SEND IT AGAIN', 'WE ARE READY TO GO', 'I WILL BE THERE', 'LET US TRY AGAIN', 'YOU ARE DOING WELL', 'IT IS A GOOD DAY', 'KEEP UP THE PRACTICE']},
 {id:25,chars:'',title:'The final transmission',description:'Put words, numbers, and punctuation together by ear.',stage:'Advanced',type:'ears',words:['MEET ME AT 10:30.', 'ARE YOU READY?', 'YES, I AM HERE.', 'SEND THE NEXT MESSAGE.', 'WE HAVE 3 MORE SIGNALS.', 'THE WEATHER IS GOOD.', 'THANK YOU FOR YOUR HELP.', 'PLEASE WAIT 2 MINUTES.', 'I CAN UNDERSTAND MORSE.', 'SEE YOU TOMORROW.']},
];
export function clean(value){return String(value).toUpperCase().trim().replace(/\s+/g,' ')}
export function symbols(value){return [...clean(value)].map(c=>c===' '?' / ':CODE[c]||'').join(' ').replaceAll('-', '−')}
export function timing(text,wpm=18,gapScale=1){
 const unit=1.2/Math.max(5,Math.min(40,wpm)), events=[]; let at=0;
 const words=clean(text).split(' ');
 words.forEach((word,wi)=>{
   [...word].forEach((char,ci)=>{
     const pattern=CODE[char]; if(!pattern) throw new Error(`Unsupported character: ${char}`);
     [...pattern].forEach((mark,mi)=>{const duration=(mark==='.'?1:3)*unit;events.push({start:at,duration,mark,char});at+=duration;if(mi<pattern.length-1)at+=unit});
     if(ci<word.length-1)at+=3*unit*gapScale;
   });
   if(wi<words.length-1)at+=7*unit*gapScale;
 });
 return {events,duration:at,unit};
}
export function blankState(){return {version:1,completed:{},stats:{},history:[],days:{},xp:0,firstListen:0,settings:{wpm:18,gap:2.5,volume:.25,tone:600},lastLesson:0}}
export function readState(storage){try{return validateState(JSON.parse(storage.getItem('signal-school-v1'))) }catch{return blankState()}}
export function validateState(input){
 if(!input||input.version!==1)throw new Error('Choose a MORSE progress file.');
 const result=blankState();
 for(const [k,v] of Object.entries(input.completed||{}))if(LESSONS[Number(k)]&&Number.isFinite(v))result.completed[k]=Math.max(0,Math.min(100,v));
 for(const [k,v] of Object.entries(input.stats||{}))if(CODE[k]&&v&&Number.isFinite(v.correct)&&Number.isFinite(v.total))result.stats[k]={correct:Math.max(0,Math.min(v.correct,v.total)),total:Math.max(0,v.total)};
 for(const [k,v] of Object.entries(input.days||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&Number.isFinite(v))result.days[k]=Math.max(0,Math.min(100000,v));
 result.history=(Array.isArray(input.history)?input.history:[]).filter(x=>x&&typeof x.date==='string'&&Number.isFinite(x.accuracy)&&Number.isFinite(x.total)).slice(-60).map(x=>({date:x.date,accuracy:Math.min(100,Math.max(0,x.accuracy)),total:Math.min(100,Math.max(0,x.total)),label:String(x.label||'Practice').slice(0,80)}));
 for(const k of ['xp','firstListen'])result[k]=Math.max(0,Math.min(1e8,Number(input[k])||0));
 const settings=input.settings||{};
 for(const [key,min,max] of [['wpm',8,30],['gap',1,4],['volume',.05,.7],['tone',400,900]])if(Number.isFinite(settings[key]))result.settings[key]=Math.max(min,Math.min(max,settings[key]));
 result.lastLesson=Math.max(0,Math.min(LESSONS.length-1,Number(input.lastLesson)||0)); return result;
}
export function today(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
export function streak(days,date=new Date()) {const d=new Date(date); let count=0;if(!days[today(d)])d.setDate(d.getDate()-1);while(days[today(d)]){count++;d.setDate(d.getDate()-1)}return count}
export function nextLesson(state){return LESSONS.find(l=>!(state.completed[l.id]>=80))||LESSONS[LESSONS.length-1]}
export function unlocked(id,state){return id===0||state.completed[id-1]>=80||state.completed[id]>=80}
export function knownChars(state){const known=GROUPS.filter((_,i)=>state.completed[i]>=80).map(g=>g[0]).join('');return known||'ET'}
export function makeQueue(lesson,state,random=Math.random){
 if(lesson.words)return [...lesson.words].sort(()=>random()-.5).slice(0,10);
 if(lesson.type==='final')return Array.from({length:10},()=>Array.from({length:3},()=> 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(random()*36)]).join(''));
 const fresh=[...lesson.chars], prior=[...GROUPS.slice(0,lesson.id).map(g=>g[0]).join('')];
 const queue=[...fresh,...fresh];
 while(queue.length<10){const pool=prior.length&&random()<.3?prior:fresh;const weighted=pool.flatMap(c=>{const st=state.stats[c];return Array(!st||st.correct/Math.max(1,st.total)<.8?3:1).fill(c)});queue.push(weighted[Math.floor(random()*weighted.length)])}
 for(let i=queue.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}return queue.slice(0,10);
}
export function recordAnswer(state,target,correct,independent){
 for(const char of clean(target).replaceAll(' ','')){if(!CODE[char])continue;const st=state.stats[char]||(state.stats[char]={correct:0,total:0});st.total++;if(correct)st.correct++}
 state.xp+=correct?10:2;if(correct){const day=today();state.days[day]=(state.days[day]||0)+1;if(independent)state.firstListen++}
}
