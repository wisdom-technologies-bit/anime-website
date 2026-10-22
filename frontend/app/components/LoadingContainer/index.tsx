import React from "react";
import LoadingSvg from "@/public/assets/Eclipse-1s-200px.svg";
import Image from "next/image";
const logo = "/logo-mark.svg";
import styles from "./component.module.css";

function LoadingPageContainer() {
  return (
    <div id={styles.container}>
      <div id={styles.content_container}>
        <div id={styles.img_container}>
          <Image fill alt="KumoriTV logo" src={logo} />
        </div>

        <LoadingSvg width={64} height={82} alt="Loading" />

        <p>Loading...</p>
      </div>
    </div>
  );
}

export default LoadingPageContainer;
