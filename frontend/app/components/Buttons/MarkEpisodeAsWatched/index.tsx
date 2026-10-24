"use client";
import React, { useEffect, useState } from "react";
import CheckSvg from "@/public/assets/check-circle.svg";
import CheckFillSvg from "@/public/assets/check-circle-fill.svg";
import { isWatched, markWatched, subscribe } from "@/app/lib/local-store/progress";
import styles from "./component.module.css";
import { AnimatePresence, motion } from "framer-motion";
type BtnTypes={episodeNumber:number;episodeTitle:string;mediaId:number;maxEpisodesNumber?:number;showAdditionalText?:boolean;wasWatched?:boolean};
export default function MarkEpisodeAsWatchedButton({episodeNumber,episodeTitle,mediaId,wasWatched,showAdditionalText}:BtnTypes){const [active,setActive]=useState(wasWatched??false);const [loading,setLoading]=useState(false);useEffect(()=>{const sync=()=>setActive(isWatched(mediaId,episodeNumber));sync();return subscribe(sync)},[mediaId,episodeNumber]);async function toggle(){setLoading(true);markWatched(mediaId,episodeNumber,!active);setActive(!active);setLoading(false)}return <div className={styles.button_container}><motion.button onClick={toggle} data-active={active} disabled={loading} title={active?"Mark as Unwatched":"Mark as Watched"}>{active?<CheckFillSvg width={16} height={16} alt="Check Episode as Watched"/>:<CheckSvg width={16} height={16} alt="Check Episode as Not Watched"/>}</motion.button><AnimatePresence>{showAdditionalText&&active&&<motion.span className={styles.text_span} initial={{opacity:0,y:"10px"}} animate={{opacity:1,y:0,transition:{duration:.2}}} exit={{opacity:0,y:"10px"}}>Watched</motion.span>}</AnimatePresence></div>}
