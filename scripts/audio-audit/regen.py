# Audio audit: re-record flagged clips; install only takes that two independent listening models accept.
import json,base64,os,requests,subprocess,concurrent.futures as cf,time,threading,unicodedata
K=os.environ['LOVABLE_API_KEY'];D='/dev-server/src/assets/audio/';H=os.path.dirname(os.path.abspath(__file__));N='/tmp/audit-new';os.makedirs(N,exist_ok=True)
key=lambda s:'-'.join(format(ord(c),'04x') for c in s)
def find(k,t):
  for v in {t, t.replace('\u0651',''), }:pass
  # try both shaddah mark orders
  cands=[t]
  if '\u0651' in t:
    base=[c for c in t if c!='\u0651']; cands+=[base[0]+'\u0651'+''.join(base[1:]), ''.join(base[:2])+'\u0651'+''.join(base[2:])]
  for c in cands:
    if os.path.exists(D+f"{k}-{key(c)}.mp3.asset.json") or os.path.exists(D+f"{k}-{key(c)}.mp3"): return c
T=[]
for line in open(H+'/targets.txt'):
  k,*xs=line.split()
  for x in xs:
    c=find(k,x)
    if c: T.append((k,c))
    else: print('no file',k,x)
SYS=("You are a strict Arabic phonetics reviewer auditing a children's reading app. You get a short teacher recording and the exact Arabic text it must say. Kind 'unit' = one isolated sound (letter + mark; sukoon = consonant alone with no vowel; shaddah = audibly doubled/held consonant; tanween = vowel + n; madd = long vowel). Kind 'word' = the whole word spoken once, continuously, at natural speed. Report what you hear in fully vowelled Arabic, then judge exact match of every letter, vowel, sukoon, shaddah, tanween. Flag extra words, letter names, English, cut-off audio, choppy syllables in a word.")
SC={"type":"object","additionalProperties":False,"required":["heard","match","issues"],"properties":{"heard":{"type":"string"},"match":{"type":"boolean"},"issues":{"type":"string"}}}
def rule(t):
  if '\u0651' in t: return "The consonant carries shaddah: hold and double it audibly, then the vowel."
  if any(c in t for c in '\u064b\u064c\u064d'): return "Tanween: the short vowel followed by a clear n sound."
  if '\u0652' in t: return "Sukoon: the consonant alone, no vowel at all."
  if t.endswith(('ا','و','ي')): return "Long vowel: hold the vowel for two counts."
  return "Short vowel only: short, crisp, not stretched, not the letter name."
def tts(k,t,a):
  p=(f"Read this single Arabic word exactly as vowelled, once, at natural normal speed, smoothly as one continuous word, like a calm female teacher. Pronounce every vowel mark exactly as written even if the dictionary form differs; do not add ال; pronounce the final vowel: {t}" if k=='w' else
     f"Say only this one isolated Arabic sound, once, clearly, like a calm female teacher. Do not say the letter's name or any other words. {rule(t)} Sound: {t}")
  x=requests.post("https://ai.gateway.lovable.dev/v1/audio/speech",headers={"Authorization":"Bearer "+K},json={"model":"google/gemini-3.1-flash-tts-preview","stream_format":"audio","contents":[{"role":"user","parts":[{"text":p}]}],"generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":"Kore"}}}}},timeout=150)
  if x.status_code==402: raise SystemExit('credits')
  if x.status_code!=200: return None
  w=f"{N}/{k}-{key(t)}-{a}.wav";o=w[:-4]+".mp3";open(w,'wb').write(x.content)
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i',w,'-af','silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse','-ac','1','-b:a','64k',o]);return o
def review(m,k,t,f):
  b=base64.b64encode(open(f,'rb').read()).decode()
  for a in range(3):
    try:
      x=requests.post("https://ai.gateway.lovable.dev/v1/chat/completions",headers={"Authorization":"Bearer "+K},json={"model":m,"messages":[{"role":"system","content":SYS},{"role":"user","content":[{"type":"text","text":f"Kind: {'word' if k=='w' else 'unit'}\nExpected text: {t}"},{"type":"input_audio","input_audio":{"data":b,"format":"mp3"}}]}],"response_format":{"type":"json_schema","json_schema":{"name":"a","strict":True,"schema":SC}}},timeout=150)
      if x.status_code==200: return json.loads(x.json()['choices'][0]['message']['content'])
    except Exception: pass
    time.sleep(3)
  return {"match":False,"heard":"","issues":"review failed"}
RP=H+'/results.json';res=json.load(open(RP)) if os.path.exists(RP) else {};L=threading.Lock()
def go(it):
  k,t=it;kk=f"{k}-{key(t)}"
  if kk in res and (res[kk]['ok'] or res[kk].get('heard')): return
  out={"text":t,"kind":k,"ok":False,"heard":[]}
  try:
    for a in range(3):
      f=tts(k,t,a)
      if not f: continue
      v=review("google/gemini-3.1-pro-preview",k,t,f)
      if v['match']: v=review("google/gemini-3.8-flash",k,t,f)
      if v['match']:
        o=subprocess.run(['lovable-assets','create','--file',f,'--filename',kk+'.mp3'],capture_output=True,text=True)
        if o.returncode==0:
          json.loads(o.stdout); open(D+kk+'.mp3.asset.json','w').write(o.stdout)
          if os.path.exists(D+kk+'.mp3'): os.remove(D+kk+'.mp3')
          out["ok"]=True
        break
      out["heard"].append(v['heard'])
  except SystemExit: raise
  except Exception as e: out["err"]=str(e)
  with L: res[kk]=out; json.dump(res,open(RP,'w'),ensure_ascii=False,indent=1)
print(len(T),flush=True)
with cf.ThreadPoolExecutor(6) as ex: list(ex.map(go,T))
print(sum(v['ok'] for v in res.values()),'of',len(res))
