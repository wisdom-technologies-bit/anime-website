import Link from "next/link";
import React from "react";
import styles from "../footerComponent.module.css";

function FooterHeading() {
  return (
    <div id={styles.social_links_container} className="display_flex_row">
      <Link href="/" aria-label="KumoriTV home">
        <img
          src="/logo.svg"
          alt="KumoriTV logo"
          height={32}
          className={styles.logo}
        />
      </Link>

      <div id={styles.social_media_container}>
        <ul className="display_flex_row">
          <li>
            <Link
              href="https://discord.gg/J8CjhJWrnu"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join KumoriTV on Discord"
            >
              <img
                src="/assets/discord.svg"
                alt="Discord"
                width={28}
                height={28}
              />
              <span>Discord</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FooterHeading;
