import React, { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

const Banner = ({ items, onClick }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <div className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="items-center embla__container">
          {items &&
            items.map((v, index) => (
              <div
                className={`embla__slide ${
                  index === selectedIndex ? "is-active" : ""
                }`}
                key={index}
              >
                <img
                  className="slide-img rounded-xl"
                  src={v.image || v}
                  alt="slide-1"
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Banner;
