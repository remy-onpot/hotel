"use client";

import Select from "react-select";
import styles from "./styles.module.css";
import { useEffect, useState } from "react";

export default function CustomSelect({
  options,
  value,
  defaultValue,
  onChange,
  name,
  id,
  ariaLabel,
  ariaLabelledBy,
  placeholder = "Select…",
  isSearchable = false,
  isClearable = false,
  required = false,
  className = "",
}) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    const selectedLabel = value?.label ?? defaultValue?.label ?? placeholder;
    return (
      <div className={`${styles.select} ${styles.selectPlaceholder} ${className}`} aria-hidden="true">
        <span>{selectedLabel}</span>
        <span className={styles.placeholderIndicator} />
      </div>
    );
  }

  return (
    <Select
      options={options}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      name={name}
      inputId={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isClearable={isClearable}
      required={required}
      className={`${styles.select} ${className}`}
      classNamePrefix="hotel-select"
      unstyled
    />
  );
}
