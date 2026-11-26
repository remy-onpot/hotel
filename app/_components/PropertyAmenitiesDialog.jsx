"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PropertyAmenitiesDialog.module.css";

export default function PropertyAmenitiesDialog({
  children,
  triggerClassName = "",
  triggerLabel = "Explore all property amenities",
  dialogId = "property-amenities-dialog",
  titleId = "property-amenities-dialog-title",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isOpen]);

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.trigger} ${triggerClassName}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={() => setIsOpen(true)}
      >
        {triggerLabel} <span aria-hidden="true">→</span>
      </button>
      {isOpen && (
        <dialog
          ref={dialogRef}
          id={dialogId}
          className={styles.dialog}
          aria-labelledby={titleId}
          onClose={() => setIsOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div className={styles.closeBar}>
            <button type="button" className={styles.closeButton} onClick={closeDialog} aria-label="Close property amenities">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className={styles.dialogContent}>{children}</div>
        </dialog>
      )}
    </>
  );
}
