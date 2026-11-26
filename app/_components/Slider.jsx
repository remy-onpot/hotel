"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function Slider({ height = "calc(100vh - 64px)", imgPriority = false, images, children, className = "", quality = 90, dimImages = true }) {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => current >= images.length ? 1 : current + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length]);

  function handleTranslate(index) {
    setActive(index);
  }

  return (
    <div className={`slider${className ? " slider--hero" : ""}${dimImages ? "" : " slider--bright"} ${className}`} style={{ maxHeight: height }}>
      {/* OVERLAY */}
      <div className="slider-overlay">{children}</div>
      {/* END OVERLAY */}

      {/* SLIDES */}
      <div className="slideshow">
        {images.map((item, index) => (
          <div key={item} className={`slide ${active === index + 1 ? "active" : ""}`}>
            <Image
              loading={imgPriority && index === 0 ? "eager" : "lazy"}
              fill
              sizes="100vw"
              quality={quality}
              src={item}
              alt=""
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
      {/* END SLIDES */}

      {/* SLIDER MENU */}
      <nav className="slider-menu">
        {images.map((undefined, index) => (
          <button
            key={index}
            onClick={() => handleTranslate(index + 1)}
            className={active === index + 1 ? "active" : ""}
            type="button"
            aria-label={`Show hotel photo ${index + 1}`}
            aria-current={active === index + 1 ? "true" : undefined}
          ></button>
        ))}
      </nav>
      {/* END SLIDER MENU */}

      {/* SLIDER CONTROL */}
      {/* END SLIDER CONTROL */}
    </div>
  );
}

export default Slider;
