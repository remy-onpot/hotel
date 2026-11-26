"use client";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import { useState, createContext, cloneElement, useContext, useEffect } from "react";

const ModalContext = createContext();

function Modal({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return <ModalContext.Provider value={{ isOpen, open, close }}>{children}</ModalContext.Provider>;
}

function Overlay({ hideOnLargerScreens = true, children }) {
  const { isOpen } = useContext(ModalContext);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen) return null;
  return createPortal(
    <div className={`${styles.modalOverlay} ${hideOnLargerScreens ? styles.hideOnLargerScreens : ""}`}>
      {children}
    </div>,
    document.body
  );
}

function Heading({ children }) {
  return <h2>{children}</h2>;
}

function ToggleOpen({ children }) {
  const { open } = useContext(ModalContext);
  return cloneElement(children, { onClick: open });
}

function Wrapper({ hideOnLargerScreens = true, children }) {
  return (
    <div className={`${styles.modalWrapper} ${hideOnLargerScreens ? styles.hideOnLargerScreens : ""}`}>{children}</div>
  );
}

function ToggleClose({ children }) {
  const { close } = useContext(ModalContext);
  return cloneElement(children, { onClick: close });
}

Modal.Heading = Heading;
Modal.ToggleOpen = ToggleOpen;
Modal.Wrapper = Wrapper;
Modal.Overlay = Overlay;
Modal.ToggleClose = ToggleClose;

export default Modal;
