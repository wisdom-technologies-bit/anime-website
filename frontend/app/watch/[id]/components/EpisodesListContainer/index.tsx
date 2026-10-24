"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import styles from "./component.module.css";
import MarkEpisodeAsWatchedButton from "@/app/components/Buttons/MarkEpisodeAsWatched";
import { convertFromUnix } from "@/app/lib/formatDateUnix";

type Props = { mediaId:number; activeEpisodeNumber:number; audio:"sub"|"dub"; nextAiringEpisodeInfo?:{episode:number;airingAt?:number} };
export default function EpisodesListContainer({mediaId,activeEpisodeNumber,audio,nextAiringEpisodeInfo}:Props) {
  const [state,setState]=useState<any>(null); const [retry,setRetry]=useState(0); const active=useRef<HTMLLIElement>(null); const searchParams=useSearchParams();
  useEffect(()=>{let live=true; const load=()=>fetch(`/api/anime/${mediaId}/episodes`).then(r=>r.json()).then(x=>{if(live)setState(x)}).catch(()=>{}); load(); const timer=setInterval(()=>{if(state?.status==="syncing")load()},3000); return()=>{live=false;clearInterval(timer)}},[mediaId,retry,state?.status]);
  useEffect(()=>{active.current?.scrollIntoView({block:"nearest"})},[state,activeEpisodeNumber]);
  const loading=!state||state.status==="syncing";
  return <div id={styles.episodes_list_container}><div className={styles.heading_container}><h3>EPISODES {audio==="dub"?"(DUB)":""}</h3><p>on KUMORITV</p></div>
    {state?.status==="unavailable" ? <div className={styles.filler_alert_text}>No episodes available yet <button type="button" onClick={()=>setRetry(x=>x+1)}>Retry</button></div> : <motion.ol id={styles.list_container} data-loading={loading}>
      {loading ? Array.from({length:5},(_,i)=><li className="item_placeholder" key={i} />) : state.episodes.map((ep:any)=><motion.li key={ep.number} ref={ep.number===activeEpisodeNumber?active:null} data-active={ep.number===activeEpisodeNumber}>
        <Link href={`/watch/${mediaId}?ep=${ep.number}&audio=${audio}`} title={`Episode ${ep.number}`}><div className={styles.img_container}><span>{ep.number}</span></div></Link>
        <div className={styles.episode_info_container}><Link href={`/watch/${mediaId}?ep=${ep.number}&audio=${audio}`}><h4>{ep.title||`Episode ${ep.number}`}</h4></Link><MarkEpisodeAsWatchedButton episodeNumber={ep.number} episodeTitle={ep.title||`Episode ${ep.number}`} mediaId={mediaId} maxEpisodesNumber={state.episodes.length} wasWatched={false} showAdditionalText={false}/></div>
      </motion.li>)}
      {nextAiringEpisodeInfo&&<li className={styles.next_episode_container}><div className={styles.img_container}><span>{nextAiringEpisodeInfo.episode}</span></div><div className={styles.episode_info_container}><small>Next episode</small>{nextAiringEpisodeInfo.airingAt&&<small>{convertFromUnix(nextAiringEpisodeInfo.airingAt)}</small>}</div></li>}
    </motion.ol>}
  </div>;
}
