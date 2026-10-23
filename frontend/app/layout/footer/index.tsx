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
        <FooterHeading />

        <span id={styles.span_border1}></span>

        <NavLinks />
      </section>

      <section id={styles.copyright_section} className="">
        <div className="center display_flex_row">
          <div className={styles.copyright_text}>
            <small>
              Copyright © {currYear}, KumoriTV. All Rights Reserved
            </small>
          </div>

          <div className={styles.privacy_policy}>
            <Link href="#">
              <small>Privacy Policy</small>
            </Link>
          </div>
        </div>

        <p className={styles.disclaimer}>
          Disclaimer: This site KumoriTV does not store any files on its server.
          All contents are provided by non-affiliated third parties.
        </p>
      </section>
    </footer>
  );
}

export default Footer;