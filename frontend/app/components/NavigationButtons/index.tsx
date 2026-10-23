"use client";
import React, { useEffect, useState } from "react";
import styles from "./component.module.css";

type PropsType = {
  propsFunction: (parameter: string | number) => void;
  buttonOptions: { isAvailable: boolean; name: string; value: string }[];
  currValue?: string | number;
  sepateBtnsWithSpan?: boolean;
  showSourceStatus?: boolean;
};

export default function NavigationButtons({ propsFunction, buttonOptions, currValue, sepateBtnsWithSpan }: PropsType) {
  const [lastValueReturned, setLastValueReturned] = useState<string | number>();
  useEffect(() => setLastValueReturned(currValue || 1), [currValue]);
  return <div className={styles.nav_button_container}>
    {buttonOptions.map((button) => <React.Fragment key={button.value}>
      <button data-active={lastValueReturned === button.value} onClick={() => { if (lastValueReturned !== button.value) { propsFunction(button.value); setLastValueReturned(button.value); } }} aria-label={button.name} disabled={currValue === button.value}>{button.name}</button>
      {sepateBtnsWithSpan && <span className={styles.separate_text}> | </span>}
    </React.Fragment>)}
  </div>;
}
// TODO(task-7a): restore provider availability indicators with the streaming implementation.
