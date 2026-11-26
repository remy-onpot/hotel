"use client";

import Select from "react-select";
import styles from "./styles.module.css";

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
