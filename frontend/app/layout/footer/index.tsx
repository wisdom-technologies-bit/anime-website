import React from "react";
import styles from "./footerComponent.module.css";
import Link from "next/link";
import FooterHeading from "./components/footerHeading";
import NavLinks from "./components/navLinks";

function Footer() {
  const currYear = new Date().getFullYear();

  return (
    <footer id={styles.footer}>
      <section id={styles.info_container}>
        <Link href="/" aria-label="KumoriTV home">
          <img src="/logo.svg" alt="KumoriTV logo" height={32} className={styles.logo} />
        </Link>

        <FooterHeading />

        <span id={styles.span_border1}></span>

        <NavLinks />
      </section>

      <section id={styles.copyright_section} className="">
        <div className="center display_flex_row">
          <div>
            <small>
              Copyright © {currYear}, KumoriTV. All Rights Reserved*
            </small>
          </div>

          <div>
            <Link href="#">
              <small>Privacy Police</small>
            </Link>
          </div>
        </div>
      </section>
    </footer>
  );
}

export default Footer;
