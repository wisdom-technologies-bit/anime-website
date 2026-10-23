import Link from "next/link";
import pageStyles from "../../components/PageHeading/GridInfo/component.module.css";
import PlaySvg from "@/public/assets/play2.svg";
import styles from "./component.module.css";

export default function PlayBtn({
  mediaId,
  mediaTitle,
}: {
  mediaId: number;
  mediaTitle: string;
  mediaFormat?: string;
  anilistLastEpisodeWatched?: number;
}) {
  return (
    <li className={`${pageStyles.info_item} ${pageStyles.action_btn}`}>
      <Link
        id={styles.container}
        href={`/watch/${mediaId}?ep=1`}
        aria-label={`Watch ${mediaTitle}`}
        title={`Watch ${mediaTitle}`}
      >
        <PlaySvg fill="#fff" width={16} height={16} />
        <span>WATCH NOW</span>
      </Link>
    </li>
  );
}
